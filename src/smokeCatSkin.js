const poseFiles = {
  typing: '01_work_typing',
  loaf: '02_loaf_front',
  napLeft: '03_nap_left',
  napRight: '04_nap_right',
  napFlat: '05_nap_pancake',
  groom: '06_groom',
  stretch: '07_stretch',
  zoomies: '08_zoomies',
  bugHunt: '09_bug_hunt',
  boxPeek: '10_box_peek',
  somersault: '11_somersault',
  feedKibble: '12_feed_kibble',
  feedCan: '13_feed_can',
  feedChuru: '14_feed_churu',
  playWand: '15_play_wand',
  playYarn: '16_play_yarn',
  tailChase: '17_tail_chase',
  mouse: '18_work_mouse',
  idle: '19_work_idle',
  pet: '20_work_pet',
  portrait: '21_portrait'
};

const sleepPoses = ['napLeft', 'napRight', 'napFlat'];
const propsInPose = { boxPeek: 'boxGroup', feedKibble: 'foodBowlGroup', feedCan: 'tunaCanGroup' };
const mirrorable = new Set(['stretch', 'groom', 'bugHunt']);
const widePoses = new Set([...sleepPoses, 'stretch', 'zoomies', 'bugHunt']);

function getPose(behavior, input) {
  switch (behavior.mode) {
    case 'work':
      if (input.isPetting) return 'pet';
      if (input.typingLookTimer > 0) {
        // When viewer's left paw (cat's rightPaw) is striking, use 01_work_typing (left paw raised!).
        // When viewer's right paw (cat's leftPaw) is striking, use 19_work_idle + skeletal pawR strike!
        if (input.rightPaw.mode === 'typing' && input.rightPaw.timer > 0) return 'typing';
        return 'idle';
      }
      return input.rightPaw.mode === 'mouse' ? 'mouse' : 'idle';
    case 'exhausted':
    case 'nap':
      return sleepPoses[behavior.variant] || 'napLeft';
    case 'somersault':
      return behavior.timer >= 20 && behavior.timer < 72 ? 'somersault' : 'bugHunt';
    default:
      return behavior.mode;
  }
}

function getOutline(image) {
  const mask = document.createElement('canvas');
  const ratio = 144 / Math.max(image.naturalWidth, image.naturalHeight);
  const w = mask.width = Math.ceil(image.naturalWidth * ratio);
  const h = mask.height = Math.ceil(image.naturalHeight * ratio);
  const ctx = mask.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let left = w, right = 0, top = h, bottom = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 110) continue;
      left = Math.min(x, left);
      right = Math.max(x, right);
      top = Math.min(y, top);
      bottom = Math.max(y, bottom);
    }
  }
  left = Math.max(0, left - 2);
  top = Math.max(0, top - 2);
  right = Math.min(w, right + 3);
  bottom = Math.min(h, bottom + 3);
  if (left >= right || top >= bottom) return null;

  return {
    image, data, w, h, left, top, right, bottom,
    uvMinX: left / w,
    uvMinY: top / h,
    uvSpanX: (right - left) / w,
    uvSpanY: (bottom - top) / h
  };
}

// ============================================================================
// WebGL 2D Skeletal Mesh Skinning Renderer
// Drives a 36x36 subdivided mesh with smooth anatomical bone weights:
//   - head bone (yaw/pitch/roll + petting jelly)
//   - earL / earR bones (elastic twitch on keystroke & pet)
//   - pawL bone (viewer's left paw = input.rightPaw: lift, reach, strike)
//   - pawR bone (viewer's right paw = input.leftPaw: lift, reach, strike)
//   - torso/chest bone (breathing + typing lean)
//   - tail 3-segment wave chain (continuous sinusoidal swish)
//   - keyboard anchor (rock-solid bottom strip with crisp key recoil)
// ============================================================================
function createSkeletalWebGL(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true
  });
  if (!gl) return null;

  const vsSrc = `
    attribute vec2 aGrid;
    uniform vec2 uCanvasSize;
    uniform vec2 uCenter;
    uniform vec2 uSize;
    uniform vec4 uUvRect;
    uniform float uFlip;
    uniform float uAngle;
    uniform float uStretch;
    uniform float uDeskRig;

    // Live skeleton uniforms driven by app.js kinematics
    uniform float uBreath;
    uniform float uTailPhase;
    uniform float uTailAmp;
    uniform vec3 uHead;      // x: shiftX, y: shiftY, z: roll
    uniform vec2 uJelly;     // petting squish
    uniform float uEarTwitch;
    uniform vec4 uPawL;      // viewer's left paw (rightPaw): x: dx, y: dy, z: rot, w: squash
    uniform vec4 uPawR;      // viewer's right paw (leftPaw): x: dx, y: dy, z: rot, w: squash
    uniform vec2 uKbRecoil;  // x: y-drop, y: tiltZ

    varying vec2 vUv;

    float gauss2(vec2 p, vec2 c, vec2 r) {
      vec2 d = (p - c) / r;
      return exp(-dot(d, d));
    }

    vec2 rotateAround(vec2 p, vec2 pivot, float a) {
      float ca = cos(a);
      float sa = sin(a);
      vec2 q = p - pivot;
      return pivot + vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
    }

    void main() {
      vec2 g = aGrid; // [0..1, 0..1] in cropped sprite space (y=0 top, y=1 bottom)
      vUv = vec2(uUvRect.x + g.x * uUvRect.z, uUvRect.y + g.y * uUvRect.w);

      vec2 p = g;

      if (uDeskRig > 0.5) {
        // Keyboard anchor mask: lock entire keyboard (including top key row) rock-solid!
        float kbMask = smoothstep(0.775, 0.825, g.y);
        float catMask = 1.0 - kbMask;

        // 1. Torso / Chest breathing & typing lean
        float chestW = gauss2(g, vec2(0.44, 0.54), vec2(0.30, 0.24)) * catMask;
        p.x += (g.x - 0.44) * uBreath * 0.022 * chestW;
        p.y -= uBreath * 0.014 * chestW;

        // 2. Head bone (pivot at neck (0.45, 0.42))
        float headW = smoothstep(0.52, 0.26, g.y) * smoothstep(0.76, 0.56, g.x) * smoothstep(0.14, 0.30, g.x);
        vec2 headPivot = vec2(0.45, 0.42);
        vec2 pHead = rotateAround(p, headPivot, uHead.z);
        pHead += vec2(uHead.x, uHead.y);
        // Petting jelly squish on upper head
        pHead += vec2(uJelly.x, -uJelly.y) * smoothstep(0.42, 0.14, g.y);
        p = mix(p, pHead, headW);

        // 3. Ear tip bones (elastic secondary bounce)
        float earLW = gauss2(g, vec2(0.37, 0.09), vec2(0.08, 0.09));
        float earRW = gauss2(g, vec2(0.58, 0.09), vec2(0.08, 0.09));
        p += vec2(-0.014, -0.010) * uEarTwitch * earLW;
        p += vec2( 0.014, -0.010) * uEarTwitch * earRW;

        // 4. Viewer's LEFT paw bone (cat's rightPaw: forearm/wrist above keyboard)
        float pawLW = gauss2(g, vec2(0.31, 0.66), vec2(0.115, 0.115)) * catMask;
        vec2 pawLPivot = vec2(0.30, 0.54);
        vec2 pPawL = rotateAround(p, pawLPivot, uPawL.z);
        pPawL += vec2(uPawL.x, uPawL.y);
        pPawL.x += (p.x - 0.31) * uPawL.w * 0.14;
        p = mix(p, pPawL, clamp(pawLW * 1.25, 0.0, 1.0));

        // 5. Viewer's RIGHT paw bone (cat's leftPaw: forearm/wrist above keyboard)
        float pawRW = gauss2(g, vec2(0.50, 0.66), vec2(0.115, 0.115)) * catMask;
        vec2 pawRPivot = vec2(0.50, 0.54);
        vec2 pPawR = rotateAround(p, pawRPivot, uPawR.z);
        pPawR += vec2(uPawR.x, uPawR.y);
        pPawR.x += (p.x - 0.50) * uPawR.w * 0.14;
        p = mix(p, pPawR, clamp(pawRW * 1.25, 0.0, 1.0));

        // 6. Bushy tail 3-segment wave chain (right side: u > 0.66, v > 0.48)
        float tailDist = clamp((g.x - 0.66) / 0.34, 0.0, 1.0);
        float tailW = smoothstep(0.64, 0.76, g.x) * smoothstep(0.44, 0.62, g.y) * smoothstep(0.96, 0.84, g.y);
        float wave = sin(uTailPhase - tailDist * 2.4) * uTailAmp * tailDist * (0.45 + 0.55 * tailDist);
        p.y += wave * 0.055 * tailW;
        p.x += cos(uTailPhase - tailDist * 2.1) * uTailAmp * 0.018 * tailDist * tailW;

        // 7. Crisp keyboard recoil on bottom strip
        p.y += uKbRecoil.x * kbMask;
        p.y += (g.x - 0.44) * uKbRecoil.y * 0.045 * kbMask;
      } else {
        // Non-desk full-body poses: gentle living breathing + subtle tail-tip sway
        float breathW = gauss2(g, vec2(0.48, 0.52), vec2(0.36, 0.32));
        p.y -= uBreath * 0.012 * breathW;
        float tailEdge = smoothstep(0.68, 0.96, g.x) * smoothstep(0.25, 0.75, g.y);
        p.y += sin(uTailPhase - g.x * 2.2) * uTailAmp * 0.025 * tailEdge;
      }

      // Map [0..1] -> local pixel coordinates centered at (0,0)
      vec2 local = (p - 0.5) * uSize;
      local.x *= uFlip;
      local.y *= uStretch;

      // Global pose rotation (somersault, bugHunt leap, wand sway)
      float ca = cos(uAngle);
      float sa = sin(uAngle);
      vec2 rot = vec2(local.x * ca - local.y * sa, local.x * sa + local.y * ca);
      vec2 screen = uCenter + rot;

      // Convert pixel coords -> NDC
      vec2 ndc = vec2(
        (screen.x / uCanvasSize.x) * 2.0 - 1.0,
        1.0 - (screen.y / uCanvasSize.y) * 2.0
      );
      gl_Position = vec4(ndc, 0.0, 1.0);
    }
  `;

  const fsSrc = `
    precision mediump float;
    uniform sampler2D uTex;
    uniform float uAlpha;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(uTex, vUv);
      gl_FragColor = vec4(c.rgb, c.a * uAlpha);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[smokeCatSkin] shader error:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[smokeCatSkin] link error:', gl.getProgramInfoLog(prog));
    return null;
  }

  // Build 36x36 subdivided mesh grid
  const SEG = 36;
  const verts = [];
  const indices = [];
  for (let y = 0; y <= SEG; y++) {
    for (let x = 0; x <= SEG; x++) {
      verts.push(x / SEG, y / SEG);
    }
  }
  for (let y = 0; y < SEG; y++) {
    for (let x = 0; x < SEG; x++) {
      const i = y * (SEG + 1) + x;
      indices.push(i, i + 1, i + SEG + 1, i + 1, i + SEG + 2, i + SEG + 1);
    }
  }

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const aGrid = gl.getAttribLocation(prog, 'aGrid');
  const u = {};
  [
    'uCanvasSize', 'uCenter', 'uSize', 'uUvRect', 'uFlip', 'uAngle', 'uStretch',
    'uDeskRig', 'uBreath', 'uTailPhase', 'uTailAmp', 'uHead', 'uJelly', 'uEarTwitch',
    'uPawL', 'uPawR', 'uKbRecoil', 'uTex', 'uAlpha'
  ].forEach((name) => { u[name] = gl.getUniformLocation(prog, name); });

  const textures = new Map();
  function getTexture(outline) {
    let tex = textures.get(outline.image);
    if (tex) return tex;
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, outline.image);
    textures.set(outline.image, tex);
    return tex;
  }

  function clear(pixelWidth, pixelHeight) {
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function renderLayer(params) {
    const tex = getTexture(params.outline);
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(u.uTex, 0);

    gl.uniform2f(u.uCanvasSize, params.width, params.height);
    gl.uniform2f(u.uCenter, params.x, params.y);
    gl.uniform2f(u.uSize, params.drawWidth, params.drawHeight);
    gl.uniform4f(u.uUvRect, params.outline.uvMinX, params.outline.uvMinY, params.outline.uvSpanX, params.outline.uvSpanY);
    gl.uniform1f(u.uFlip, params.flip);
    gl.uniform1f(u.uAngle, params.angle);
    gl.uniform1f(u.uStretch, params.stretch);
    gl.uniform1f(u.uDeskRig, params.deskRig ? 1.0 : 0.0);

    gl.uniform1f(u.uBreath, params.breath);
    gl.uniform1f(u.uTailPhase, params.tailPhase);
    gl.uniform1f(u.uTailAmp, params.tailAmp);
    gl.uniform3f(u.uHead, params.headX, params.headY, params.headRoll);
    gl.uniform2f(u.uJelly, params.jellyX, params.jellyY);
    gl.uniform1f(u.uEarTwitch, params.earTwitch);
    gl.uniform4f(u.uPawL, params.pawL.dx, params.pawL.dy, params.pawL.rot, params.pawL.squash);
    gl.uniform4f(u.uPawR, params.pawR.dx, params.pawR.dy, params.pawR.rot, params.pawR.squash);
    gl.uniform2f(u.uKbRecoil, params.kbY, params.kbTiltZ);
    gl.uniform1f(u.uAlpha, params.alpha);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  return { clear, renderLayer };
}

export function createSmokeCatSkin(canvas) {
  const webgl = createSkeletalWebGL(canvas);
  const ctx2d = webgl ? null : canvas.getContext('2d');
  const outlines = {};
  let frame = null;

  // Smooth skeletal spring state for realistic 2D bones
  const boneState = {
    pawL: { dx: 0, dy: 0, rot: 0, squash: 0 },
    pawR: { dx: 0, dy: 0, rot: 0, squash: 0 },
    earTwitch: 0,
    earVel: 0,
    prevPose: null,
    currPose: null,
    fade: 1.0
  };

  for (const [pose, file] of Object.entries(poseFiles)) {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => { outlines[pose] = getOutline(image); };
    image.src = new URL(`./skins/smoke-cat/${file}.png`, import.meta.url).href;
  }

  function computePawBone(paw, isViewerLeft) {
    // paw.strikeAge === 1 -> lift up! strikeAge === 2 -> slam down!
    let targetDx = 0;
    let targetDy = 0;
    let targetRot = 0;
    let targetSquash = 0;

    const isActive = isViewerLeft
      ? (paw.mode === 'typing' && paw.timer > 0)
      : (paw.isTyping && paw.timer > 0);

    if (isActive) {
      // Horizontal reach toward pressed key
      const keyBias = Math.max(-1, Math.min(1, (paw.target.x - paw.rest.x) * 1.15));
      targetDx = keyBias * 0.048;
      if (paw.strikeAge <= 3) {
        // Crisp wind-up lift (zero keyboard distortion)
        targetDy = -0.068;
        targetRot = (isViewerLeft ? -0.14 : 0.14);
        targetSquash = -0.25;
      } else if (paw.strikeAge <= 6) {
        // Crisp downward strike impact onto keys
        targetDy = 0.028;
        targetRot = (isViewerLeft ? 0.06 : -0.06);
        targetSquash = 0.65;
      } else {
        // Hovering ready over keys
        targetDy = -0.020 * Math.min(1, paw.timer / 10);
        targetRot = (isViewerLeft ? -0.04 : 0.04);
        targetSquash = 0.10;
      }
    } else if (isViewerLeft && paw.mode === 'mouse') {
      // Subtle mouse-hand glide
      targetDx = Math.max(-0.04, Math.min(0.04, (paw.pos.x - paw.rest.x) * 0.08));
      targetDy = Math.max(-0.02, Math.min(0.02, (paw.pos.y - paw.rest.y) * 0.06));
    }

    return { targetDx, targetDy, targetRot, targetSquash };
  }

  function draw({ enabled, behavior, input, width, height, dpr, motion }) {
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (webgl) {
      webgl.clear(pixelWidth, pixelHeight);
    } else if (ctx2d) {
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, width, height);
    }
    frame = null;
    if (!enabled) return;

    const pose = getPose(behavior, input);
    const mode = behavior.mode;
    const atDesk = mode === 'work';
    const outline = outlines[pose] || (atDesk ? (outlines.idle || outlines.typing) : null);
    if (!outline) return;

    // Smooth crossfade on pose transitions (snappy during typing, velvety during mood changes)
    if (boneState.currPose !== pose) {
      boneState.prevPose = boneState.currPose;
      boneState.currPose = pose;
      boneState.fade = atDesk ? 0.45 : 0.0;
    }
    const fadeSpeed = atDesk ? 0.28 : 0.14;
    boneState.fade = Math.min(1.0, boneState.fade + fadeSpeed);

    // Update live 2D paw bone springs from app.js 3D paw kinematics
    const tL = computePawBone(input.rightPaw, true);
    const tR = computePawBone(input.leftPaw, false);
    const lerpPaw = (cur, tgt) => {
      const k = Math.abs(tgt.targetDy) > 0.03 ? 0.56 : 0.28;
      cur.dx += (tgt.targetDx - cur.dx) * k;
      cur.dy += (tgt.targetDy - cur.dy) * k;
      cur.rot += (tgt.targetRot - cur.rot) * k;
      cur.squash += (tgt.targetSquash - cur.squash) * 0.42;
    };
    lerpPaw(boneState.pawL, tL);
    lerpPaw(boneState.pawR, tR);

    // Elastic ear twitch on keystroke impact or petting
    const impulse = (input.leftPaw.hitPop + input.rightPaw.hitPop) * 0.45 + (input.isPetting ? 0.12 : 0);
    boneState.earVel = (boneState.earVel + (impulse - boneState.earTwitch) * 0.34) * 0.68;
    boneState.earTwitch += boneState.earVel;

    const unit = Math.min(width / 500, height / 390);
    const shapeWidth = (outline.right - outline.left) * outline.image.naturalWidth / outline.w;
    const shapeHeight = (outline.bottom - outline.top) * outline.image.naturalHeight / outline.h;
    const maxWidth = (atDesk ? 268 : widePoses.has(pose) ? 286 : 224) * unit;
    const maxHeight = (atDesk ? 222 : widePoses.has(pose) ? 146 : 200) * unit;
    const scale = Math.min(maxWidth / shapeWidth, maxHeight / shapeHeight);
    const drawWidth = shapeWidth * scale;
    const drawHeight = shapeHeight * scale;

    let x = width / 2 + (atDesk ? 34 : 12) * unit;
    let ground = height / 2 + (atDesk ? 112 : 92) * unit;
    let angle = 0;
    let flip = behavior.variant === 1 && mirrorable.has(pose) ? -1 : 1;
    let stretch = 1 + Math.sin(input.breathPhase) * 0.004;

    if (atDesk) {
      x += (input.rigSpring.bodyX || 0) * 16 * unit;
      stretch += input.isPetting ? Math.sin(input.breathPhase * 3) * 0.010 : input.kbRecoil.y * 0.16;
    } else if (pose === 'zoomies') {
      flip = behavior.zoomDir > 0 ? -1 : 1;
      x += behavior.zoomX * 65 * unit;
      ground -= (11 + Math.abs(Math.sin(behavior.timer * 0.34)) * 16) * unit;
    } else if (pose === 'somersault') {
      const phase = (behavior.timer - 20) / 52;
      ground -= 65 * Math.sin(phase * Math.PI) * unit;
      angle = (phase - 0.5) * Math.PI * 2 * (behavior.variant === 1 ? -1 : 1);
    } else if (mode === 'bugHunt' && behavior.timer >= 150 && !behavior.bugCaught) {
      const leap = Math.sin(Math.min(1, (behavior.timer - 150) / 25) * Math.PI);
      ground -= 52 * leap * unit;
      angle = -0.32 * leap * flip;
    } else if (mode === 'playWand' || mode === 'playYarn' || mode === 'feedChuru') {
      angle = Math.max(-0.12, Math.min(0.12, (motion?.yaw || 0) * 0.15));
      x += Math.max(-20, Math.min(20, (motion?.yaw || 0) * 26)) * unit;
    }

    x = Math.max(drawWidth / 2 + 4 * unit, Math.min(width - drawWidth / 2 - 4 * unit, x));
    const drawY = ground - drawHeight * stretch / 2;

    const r = input.rigSpring;
    const headX = Math.max(-0.045, Math.min(0.045, (r.yaw || 0) * 0.048));
    const headY = Math.max(-0.035, Math.min(0.050, (r.pitch || 0) * 0.058));
    const headRoll = Math.max(-0.14, Math.min(0.14, -(r.roll || 0) * 0.35));
    const isTypingNow = input.typingLookTimer > 0;
    const tailAmp = input.isPetting ? 1.35 : (isTypingNow ? 1.15 : 0.72);

    const commonParams = {
      width, height, x, y: drawY, drawWidth, drawHeight, flip, angle, stretch,
      deskRig: atDesk,
      breath: Math.sin(input.breathPhase),
      tailPhase: input.tailPhase * 1.15,
      tailAmp,
      headX, headY, headRoll,
      jellyX: (input.jelly.x || 0) * 0.55,
      jellyY: (input.jelly.y || 0) * 0.55,
      earTwitch: boneState.earTwitch,
      pawL: boneState.pawL,
      pawR: boneState.pawR,
      kbY: Math.max(-0.015, Math.min(0.025, -input.kbRecoil.y * 0.25)),
      kbTiltZ: Math.max(-0.5, Math.min(0.5, input.kbRecoil.tiltZ * 2.2))
    };

    if (webgl) {
      // Crossfade previous pose underneath for buttery smooth transitions
      if (boneState.fade < 0.99 && boneState.prevPose && outlines[boneState.prevPose]) {
        webgl.renderLayer({
          ...commonParams,
          outline: outlines[boneState.prevPose],
          alpha: 1.0 - boneState.fade
        });
      }
      webgl.renderLayer({
        ...commonParams,
        outline,
        alpha: boneState.fade < 0.99 ? boneState.fade : 1.0
      });
    } else if (ctx2d) {
      const { image, left, right, top, bottom, w, h } = outline;
      const sx = image.naturalWidth / w;
      const sy = image.naturalHeight / h;
      ctx2d.save();
      ctx2d.translate(x, drawY);
      ctx2d.rotate(angle);
      ctx2d.scale(flip, stretch);
      ctx2d.drawImage(image, left * sx, top * sy, (right - left) * sx, (bottom - top) * sy, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx2d.restore();
    }

    frame = {
      pose, mode, atDesk, x, y: drawY, angle, flip, stretch, drawWidth, drawHeight, outline,
      bakedProp: propsInPose[mode]
    };
  }

  function hitTest(x, y) {
    if (!frame) return null;
    const { outline, drawWidth, drawHeight, angle, flip, stretch } = frame;
    const dx = x - frame.x, dy = y - frame.y;
    const lx = (dx * Math.cos(angle) + dy * Math.sin(angle)) * flip;
    const ly = (dy * Math.cos(angle) - dx * Math.sin(angle)) / stretch;
    const u = lx / drawWidth + 0.5, v = ly / drawHeight + 0.5;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
    const px = Math.floor(outline.left + u * (outline.right - outline.left));
    const py = Math.floor(outline.top + v * (outline.bottom - outline.top));
    if (outline.data[(py * outline.w + px) * 4 + 3] < 110) return null;
    if ((frame.atDesk && v > 0.86) || (frame.mode === 'boxPeek' && v > 0.69)) return 'prop';
    return 'cat';
  }

  function drawPortrait(target, pose) {
    const face = pose === 'happy' ? outlines.pet : outlines.portrait;
    if (!face) return false;
    const { image, w, h, left, right, top, bottom } = face;
    const xScale = image.naturalWidth / w;
    const yScale = image.naturalHeight / h;
    const x = left * xScale;
    const y = top * yScale;
    const artWidth = (right - left) * xScale;
    const artHeight = (bottom - top) * yScale;
    const size = Math.min(artWidth * 0.78, artHeight * 0.72, image.naturalHeight - y);
    const center = x + artWidth * (pose === 'happy' ? 0.43 : 0.46);
    target.drawImage(image, Math.max(0, Math.min(image.naturalWidth - size, center - size / 2)), y, size, size, 4, 9, 232, 232);
    return true;
  }

  return { draw, hitTest, drawPortrait, get frame() { return frame; } };
}
