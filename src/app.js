import * as THREE from 'three';

/**
 * Black Bongo Cat 3D Toon Desktop Pet
 * Redesigned from the ground up using Three.js WebGL Cel-Shading + Fresnel Rim Lighting:
 * 1. Velvet-Toon + Grazing Fresnel Rim Shader:
 *    - Produces the exact soft matte-black fur + delicate silver-gray rim outlines
 *      around chubby curved arms, round pom-pom paws, and tucked hind legs!
 * 2. Chubby Q-Version Kitten Proportions:
 *    - Seamless pear/onigiri torso + plump wide-cheeked round head + short rounded ears
 *    - Big 3D chartreuse eyeballs with 3D rotating pupils & real 3D upper/lower eyelids
 *      (exact match to the squinting slit eyes and rubbed half-lids in the photos!)
 *    - Real-time 3D vertex mesh squash-and-stretch when petting/rubbing the face!
 * 3. True 3D IK Short Stubby Arms + 3D 60% Keyboard + 3D Pebble Mouse + 3D Keycaps!
 */

const canvas = document.getElementById('pet-canvas');
let W = 360;
let H = 334;

const userSettings = {
  scale: 1.0,
  keyboardTheme: 'classic',
  mouseColor: 'white',
  catCoat: 'black',
  eyeColor: 'lime',
  showFloatingKeys: true,
  showImpactGlow: true,
  soundEnabled: true,
  alwaysOnTop: true,
  lockPosition: false
};

// Custom white cartoon hand cursors with dark sleeve cuff
const HAND_OPEN_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M15 4c1 0 1.8.8 1.8 1.8v6.5h.8V5.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v6.8h.8V7.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v9.5c0 4.5-3.2 8.2-7.5 8.8v2.5h-7v-2.5c-3.2-.8-5.7-3.2-6.6-6.4l-1.5-5.2c-.3-1 .3-2.1 1.3-2.4.9-.3 1.9.2 2.3 1.1l1.2 3V6.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.8h.8V5.8C13.2 4.8 14 4 15 4z' fill='white' stroke='%2318181b' stroke-width='1.8' stroke-linejoin='round'/><rect x='11.5' y='25' width='8' height='4' rx='1.5' fill='%2327272a' stroke='%2318181b' stroke-width='1.5'/></svg>") 16 14, grab`;
const HAND_GRAB_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M10 12.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v-1c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v-.8c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v1c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.5c0 4.2-3.1 7.6-7.2 8.2v2.5h-7v-2.5c-3.3-.7-5.8-3.3-6.4-6.6l-.7-3.5c-.2-1.1.5-2.1 1.6-2.4.8-.2 1.5.2 2 .8l1.3 1.8v-3z' fill='white' stroke='%2318181b' stroke-width='1.8' stroke-linejoin='round'/><rect x='11' y='24.5' width='8' height='4' rx='1.5' fill='%2327272a' stroke='%2318181b' stroke-width='1.5'/></svg>") 16 16, grabbing`;

// ============================================================================
// 1. THREE.JS SCENE, TRANSPARENT WEBGL RENDERER & CAMERA
// ============================================================================
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true
});
renderer.setSize(W, H, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(27, W / H, 0.1, 50);
camera.position.set(-0.08, 1.72, 9.1);
camera.lookAt(-0.08, -0.08, 0);

// Soft studio lighting for non-shader standard materials (keyboard, mouse, keycaps)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
keyLight.position.set(-2.2, 5.8, 5.2);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
fillLight.position.set(3.5, 2.5, 3.2);
scene.add(fillLight);

// ============================================================================
// 2. CUSTOM VELVET-TOON + FRESNEL RIM SHADERS (SIGNATURE 3D PLUSH LOOK!)
// ============================================================================
function createVelvetBlackMaterial({
  rimStrength = 0.22,
  rimStart = 0.68,
  rimEnd = 0.94,
  baseHex = 0x101014,
  litHex = 0x202028,
  rimHex = 0xdbe3ef,
  fadeUpperRim = false
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.35, 0.72, 0.60).normalize() },
      uBaseColor: { value: new THREE.Color(baseHex) },
      uLitColor: { value: new THREE.Color(litHex) },
      uRimColor: { value: new THREE.Color(rimHex) },
      uRimStrength: { value: rimStrength },
      uRimStart: { value: rimStart },
      uRimEnd: { value: rimEnd },
      uFadeUpperRim: { value: fadeUpperRim ? 1.0 : 0.0 }
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      varying vec2 vUv;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vUv = uv;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uLightDir;
      uniform vec3 uBaseColor;
      uniform vec3 uLitColor;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      uniform float uRimStart;
      uniform float uRimEnd;
      uniform float uFadeUpperRim;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vWorldNormal;
      varying vec2 vUv;

      void main() {
        vec3 N = normalize(vNormalView);
        vec3 V = normalize(vViewDir);
        vec3 WN = normalize(vWorldNormal);

        // Soft wrap diffuse lighting for plush velvet charcoal volume
        float ndl = dot(WN, uLightDir) * 0.5 + 0.5;
        float shade = smoothstep(0.24, 0.88, ndl);
        vec3 col = mix(uBaseColor, uLitColor, shade);

        // Crisp grazing Fresnel rim light (fades smoothly into chest on upper arm!)
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float rim = smoothstep(uRimStart, uRimEnd, 1.0 - ndv);
        float rimFade = mix(1.0, smoothstep(0.18, 0.52, vUv.y), uFadeUpperRim);
        col = mix(col, uRimColor, rim * uRimStrength * rimFade);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

// Body/head/ears use ultra-matte plush velvet charcoal with virtually zero ear seam;
// limbs & paws get crisp silver-gray rim outlines matching the reference screenshots!
const bodyFurMat = createVelvetBlackMaterial({
  rimStrength: 0.03,
  rimStart: 0.80,
  rimEnd: 0.98,
  baseHex: 0x09090c,
  litHex: 0x17171d,
  rimHex: 0x64748b
});

const limbFurMat = createVelvetBlackMaterial({
  rimStrength: 0.72,
  rimStart: 0.70,
  rimEnd: 0.93,
  baseHex: 0x0a0a0e,
  litHex: 0x18181f,
  rimHex: 0xe2e8f0
});

const armFurMat = createVelvetBlackMaterial({
  rimStrength: 0.84,
  rimStart: 0.64,
  rimEnd: 0.88,
  baseHex: 0x0a0a0e,
  litHex: 0x18181f,
  rimHex: 0xe2e8f0,
  fadeUpperRim: true
});

const eyelidMat = createVelvetBlackMaterial({
  rimStrength: 0.08,
  rimStart: 0.72,
  rimEnd: 0.95,
  baseHex: 0x0a0a0d,
  litHex: 0x16161c,
  rimHex: 0x64748b
});

// Glossy chartreuse-lime Toon Shader for the cat's big eyes
const irisMat = new THREE.ShaderMaterial({
  uniforms: {
    uLightDir: { value: new THREE.Vector3(-0.3, 0.7, 0.65).normalize() },
    uDarkLime: { value: new THREE.Color(0x9be02e) },
    uBrightLime: { value: new THREE.Color(0xd2f85e) }
  },
  vertexShader: `
    varying vec3 vNormalW;
    varying vec3 vNormalV;
    varying vec3 vViewDir;
    void main() {
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vNormalV = normalize(normalMatrix * normal);
      vViewDir = normalize(-mvPos.xyz);
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uLightDir;
    uniform vec3 uDarkLime;
    uniform vec3 uBrightLime;
    varying vec3 vNormalW;
    varying vec3 vNormalV;
    varying vec3 vViewDir;
    void main() {
      float ndl = dot(normalize(vNormalW), uLightDir) * 0.5 + 0.5;
      float band = smoothstep(0.32, 0.72, ndl);
      vec3 col = mix(uDarkLime, uBrightLime, band);
      float ndv = clamp(dot(normalize(vNormalV), normalize(vViewDir)), 0.0, 1.0);
      col *= mix(0.86, 1.03, smoothstep(0.0, 0.42, ndv));
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090c });
const whiskerMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });

// ============================================================================
// 3. BUILD CHUBBY 3D BLACK CAT RIG (ONIGIRI BODY + ROUND HEAD + 4 SHORT LIMBS)
// ============================================================================
const catRoot = new THREE.Group();
catRoot.position.set(0.18, 0.02, -0.35);
scene.add(catRoot);

// 3A. Chubby Pear / Onigiri Torso (LatheGeometry — smooth plush loaf!)
const torsoPoints = [
  new THREE.Vector2(0.00, -0.84),
  new THREE.Vector2(0.74, -0.82),
  new THREE.Vector2(0.90, -0.66),
  new THREE.Vector2(0.93, -0.40),
  new THREE.Vector2(0.84, -0.05),
  new THREE.Vector2(0.70,  0.28),
  new THREE.Vector2(0.58,  0.54),
  new THREE.Vector2(0.46,  0.70),
  new THREE.Vector2(0.00,  0.72)
];
const torsoGeo = new THREE.LatheGeometry(torsoPoints, 48);
torsoGeo.scale(0.96, 1.0, 0.68);
const torsoMesh = new THREE.Mesh(torsoGeo, bodyFurMat);
catRoot.add(torsoMesh);

// 3B. Cute Small Tucked Hind Feet Peeking Right Behind the Keyboard
function createHindLeg(side) {
  const grp = new THREE.Group();
  const s = side === 'left' ? -1 : 1;

  // Compact tucked hind thigh flush with lower pear hips (no oversized frog knees)
  const thighGeo = new THREE.SphereGeometry(0.24, 28, 20);
  thighGeo.scale(0.92, 1.04, 1.06);
  const thigh = new THREE.Mesh(thighGeo, bodyFurMat);
  thigh.position.set(s * 0.56, -0.62, 0.34);
  grp.add(thigh);

  // Cute stubby round hind foot peeking neatly at bottom-front edge
  const footGeo = new THREE.SphereGeometry(0.175, 28, 22);
  footGeo.scale(1.06, 0.70, 1.15);
  const foot = new THREE.Mesh(footGeo, limbFurMat);
  foot.position.set(s * 0.56, -0.77, 0.54);
  grp.add(foot);

  return grp;
}
catRoot.add(createHindLeg('left'));
catRoot.add(createHindLeg('right'));

// 3C. Curved Plush Tail (S-curve out to the right behind the keyboard)
const tailBasePts = [
  new THREE.Vector3(0.55, -0.58, -0.14),
  new THREE.Vector3(1.04, -0.54, -0.08),
  new THREE.Vector3(1.24, -0.18,  0.04),
  new THREE.Vector3(1.60, -0.06,  0.14)
];
const tailCurve = new THREE.CatmullRomCurve3(tailBasePts);
const tailGeo = new THREE.TubeGeometry(tailCurve, 28, 0.125, 16, false);
const tailMesh = new THREE.Mesh(tailGeo, bodyFurMat);
catRoot.add(tailMesh);

const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.126, 20, 16), bodyFurMat);
tailTip.position.copy(tailBasePts[3]);
catRoot.add(tailTip);

// 3D. Head Group (Sleek, plush kitten head proportional to pear torso — matches 26fac3f1.jpg!)
const headPivot = new THREE.Group();
headPivot.position.set(0, 0.54, 0.02);
catRoot.add(headPivot);

const headCenterGroup = new THREE.Group();
headCenterGroup.position.set(0, 0.34, 0);
headPivot.add(headCenterGroup);

const headGeo = new THREE.SphereGeometry(0.62, 48, 36);
const headPosAttr = headGeo.attributes.position;
const headBasePositions = new Float32Array(headPosAttr.count * 3);

for (let i = 0; i < headPosAttr.count; i++) {
  let x = headPosAttr.getX(i);
  let y = headPosAttr.getY(i);
  let z = headPosAttr.getZ(i);

  const cheekFactor = Math.max(0, 1.0 - Math.abs(y + 0.10) * 1.4);
  x *= 1.04 + cheekFactor * 0.05;
  y *= 0.96;
  z *= 0.92;

  if (y < -0.28) {
    y = -0.28 + (y + 0.28) * 0.80;
  }

  headPosAttr.setXYZ(i, x, y, z);
  headBasePositions[i * 3] = x;
  headBasePositions[i * 3 + 1] = y;
  headBasePositions[i * 3 + 2] = z;
}
headGeo.computeVertexNormals();
const headMesh = new THREE.Mesh(headGeo, bodyFurMat);
headCenterGroup.add(headMesh);

// Short Rounded Plush Kitten Ears (shorter & chubbier tip, not tall/pointy!)
const earProfile = [
  new THREE.Vector2(0.00,  0.30),
  new THREE.Vector2(0.075, 0.28),
  new THREE.Vector2(0.145, 0.22),
  new THREE.Vector2(0.215, 0.11),
  new THREE.Vector2(0.255, 0.00),
  new THREE.Vector2(0.00,  0.00)
];
const earGeo = new THREE.LatheGeometry(earProfile, 32);
earGeo.scale(1.02, 0.96, 0.78);

const leftEar = new THREE.Mesh(earGeo, bodyFurMat);
leftEar.position.set(-0.33, 0.37, -0.02);
leftEar.rotation.set(0.08, 0.12, 0.24);
headCenterGroup.add(leftEar);

const rightEar = new THREE.Mesh(earGeo, bodyFurMat);
rightEar.position.set(0.33, 0.37, -0.02);
rightEar.rotation.set(0.08, -0.12, -0.24);
headCenterGroup.add(rightEar);

// Upright Almond-Oval 3D Chartreuse Eyes (flat inlaid on face, cute oval pupils!)
function create3DEye(side) {
  const s = side === 'left' ? -1 : 1;
  const eyeSocket = new THREE.Group();
  eyeSocket.position.set(s * 0.195, 0.01, 0.535);
  eyeSocket.rotation.y = s * 0.14;
  eyeSocket.rotation.z = s * -0.04;

  const eyeFlatContainer = new THREE.Group();
  eyeFlatContainer.scale.set(0.88, 1.02, 0.34);
  eyeSocket.add(eyeFlatContainer);

  const eyeballGeo = new THREE.SphereGeometry(0.175, 32, 24);
  const eyeball = new THREE.Mesh(eyeballGeo, irisMat);
  eyeFlatContainer.add(eyeball);

  const pupilPivot = new THREE.Group();
  eyeFlatContainer.add(pupilPivot);

  const pupilGeo = new THREE.SphereGeometry(0.078, 24, 18);
  pupilGeo.scale(0.76, 1.15, 0.24);
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  pupil.position.set(0, 0, 0.165);
  pupilPivot.add(pupil);

  // 3D Upper & Lower Eyelid Hemispherical Shells
  const lidGeo = new THREE.SphereGeometry(0.186, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const upperLidPivot = new THREE.Group();
  const upperLid = new THREE.Mesh(lidGeo, eyelidMat);
  upperLidPivot.rotation.x = -1.52;
  upperLidPivot.add(upperLid);
  eyeFlatContainer.add(upperLidPivot);

  const lowerLidGeo = new THREE.SphereGeometry(0.184, 32, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52);
  const lowerLidPivot = new THREE.Group();
  const lowerLid = new THREE.Mesh(lowerLidGeo, eyelidMat);
  lowerLidPivot.rotation.x = 1.52;
  lowerLidPivot.add(lowerLid);
  eyeFlatContainer.add(lowerLidPivot);

  return { eyeSocket, pupilPivot, upperLidPivot, lowerLidPivot };
}

const leftEye3D = create3DEye('left');
const rightEye3D = create3DEye('right');
headCenterGroup.add(leftEye3D.eyeSocket);
headCenterGroup.add(rightEye3D.eyeSocket);

// Soft warm rosy cheek blush decals (fade in subtly while blissfully petted!)
const blushMat = new THREE.MeshBasicMaterial({
  color: 0xfb7185,
  transparent: true,
  opacity: 0,
  depthWrite: false
});
function createCheekBlush(side) {
  const s = side === 'left' ? -1 : 1;
  const geo = new THREE.CircleGeometry(0.085, 24);
  geo.scale(1.35, 0.72, 1.0);
  const m = new THREE.Mesh(geo, blushMat);
  m.position.set(s * 0.27, -0.145, 0.545);
  m.rotation.y = s * 0.28;
  return m;
}
headCenterGroup.add(createCheekBlush('left'));
headCenterGroup.add(createCheekBlush('right'));

// Delicate 3D Whiskers extending neatly beside muzzle
function createWhiskers(side) {
  const s = side === 'left' ? -1 : 1;
  const grp = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const dy = (1 - i) * 0.048;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.31, -0.14 + dy * 0.35, 0.46),
      new THREE.Vector3(s * 0.45, -0.15 + dy * 0.80, 0.41),
      new THREE.Vector3(s * 0.60, -0.17 + dy * 1.25, 0.34)
    ]);
    const wGeo = new THREE.TubeGeometry(curve, 8, 0.0068, 6, false);
    grp.add(new THREE.Mesh(wGeo, whiskerMat));
  }
  return grp;
}
headCenterGroup.add(createWhiskers('left'));
headCenterGroup.add(createWhiskers('right'));

// 3E. Short Chubby Front Arms (Dynamic 2-Bone Bezier Tube + Plump Round Pom-Pom Paw!)
function createDynamicArm(side) {
  const s = side === 'left' ? -1 : 1;
  const armGroup = new THREE.Group();
  catRoot.add(armGroup);

  // Rounded shoulder cap blending smoothly into torso contour
  const shoulderGeo = new THREE.SphereGeometry(0.165, 24, 18);
  const shoulderMesh = new THREE.Mesh(shoulderGeo, bodyFurMat);
  shoulderMesh.position.set(s * 0.48, 0.14, 0.36);
  armGroup.add(shoulderMesh);

  // Dynamic tapered arm tube (16 radial segments x 18 length rings updated every frame)
  const segsLen = 16;
  const segsRad = 18;
  const armGeo = new THREE.BufferGeometry();
  const vertCount = (segsLen + 1) * (segsRad + 1);
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices = [];

  for (let i = 0; i <= segsLen; i++) {
    const t = i / segsLen;
    for (let j = 0; j <= segsRad; j++) {
      const idx2 = (i * (segsRad + 1) + j) * 2;
      uvs[idx2] = j / segsRad;
      uvs[idx2 + 1] = t;
    }
  }

  for (let i = 0; i < segsLen; i++) {
    for (let j = 0; j < segsRad; j++) {
      const a = i * (segsRad + 1) + j;
      const b = (i + 1) * (segsRad + 1) + j;
      const c = (i + 1) * (segsRad + 1) + (j + 1);
      const d = i * (segsRad + 1) + (j + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }
  armGeo.setIndex(indices);
  armGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  armGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  armGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  const armMesh = new THREE.Mesh(armGeo, armFurMat);
  armMesh.frustumCulled = false;
  armGroup.add(armMesh);

  // Chubby round pom-pom paw pad at the tip!
  const pawGeo = new THREE.SphereGeometry(0.168, 28, 22);
  pawGeo.scale(1.06, 0.80, 1.12);
  const pawMesh = new THREE.Mesh(pawGeo, limbFurMat);
  armGroup.add(pawMesh);

  // Helper vectors to avoid GC
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const center = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normalVec = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const upRef = new THREE.Vector3(0, 0, 1);

  function updateArm(shPos, elbowPos, pawPos) {
    shoulderMesh.position.copy(shPos);
    pawMesh.position.copy(pawPos);

    // Orient paw gently along forearm direction
    const dirX = pawPos.x - elbowPos.x;
    const dirZ = pawPos.z - elbowPos.z;
    pawMesh.rotation.y = Math.atan2(dirX, dirZ);

    p0.copy(shPos);
    p1.copy(elbowPos);
    p2.copy(pawPos);

    for (let i = 0; i <= segsLen; i++) {
      const t = i / segsLen;
      const omt = 1 - t;

      // Quadratic Bezier point
      center.set(
        omt * omt * p0.x + 2 * omt * t * p1.x + t * t * p2.x,
        omt * omt * p0.y + 2 * omt * t * p1.y + t * t * p2.y,
        omt * omt * p0.z + 2 * omt * t * p1.z + t * t * p2.z
      );

      // Derivative tangent
      tangent.set(
        2 * omt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
        2 * omt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
        2 * omt * (p1.z - p0.z) + 2 * t * (p2.z - p1.z)
      ).normalize();

      normalVec.crossVectors(upRef, tangent);
      if (normalVec.lengthSq() < 0.001) {
        normalVec.set(1, 0, 0);
      } else {
        normalVec.normalize();
      }
      binormal.crossVectors(tangent, normalVec).normalize();

      // Chubby tapering forearm radius from 0.18 chest root to 0.138 wrist
      const radius = 0.18 * (1 - t) + 0.138 * t;

      for (let j = 0; j <= segsRad; j++) {
        const theta = (j / segsRad) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const nx = normalVec.x * cosT + binormal.x * sinT;
        const ny = normalVec.y * cosT + binormal.y * sinT;
        const nz = normalVec.z * cosT + binormal.z * sinT;

        const idx = (i * (segsRad + 1) + j) * 3;
        positions[idx]     = center.x + nx * radius;
        positions[idx + 1] = center.y + ny * radius;
        positions[idx + 2] = center.z + nz * radius;

        normals[idx]     = nx;
        normals[idx + 1] = ny;
        normals[idx + 2] = nz;
      }
    }

    armGeo.attributes.position.needsUpdate = true;
    armGeo.attributes.normal.needsUpdate = true;
  }

  return { armGroup, updateArm, pawMesh };
}

// rightArm = Viewer's LEFT (reaches to mouse or left keys); leftArm = Viewer's RIGHT (types right keys)
const rightArm3D = createDynamicArm('left');
const leftArm3D  = createDynamicArm('right');

// ============================================================================
// 4. 3D 60% MECHANICAL KEYBOARD + 3D WHITE PEBBLE MOUSE
// ============================================================================
const deskGroup = new THREE.Group();
scene.add(deskGroup);

// 4A. 3D White Pebble Mouse (Placed closely beside compact keyboard; front buttons & scroll wheel face viewer +Z!)
const mouseBasePos = new THREE.Vector3(-1.06, -0.84, 0.70);
const mouseGroup = new THREE.Group();
mouseGroup.position.copy(mouseBasePos);
mouseGroup.rotation.set(0.24, 0.08, -0.04);
deskGroup.add(mouseGroup);

const pebbleBodyGeo = new THREE.SphereGeometry(0.24, 32, 24);
pebbleBodyGeo.scale(1.0, 0.56, 1.08);
const pebbleBodyMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.40,
  metalness: 0.02
});
const pebbleBody = new THREE.Mesh(pebbleBodyGeo, pebbleBodyMat);
mouseGroup.add(pebbleBody);

// Subtle dark rim base under mouse
const mouseShadowGeo = new THREE.CircleGeometry(0.26, 32);
mouseShadowGeo.rotateX(-Math.PI / 2);
const mouseShadow = new THREE.Mesh(
  mouseShadowGeo,
  new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.32 })
);
mouseShadow.position.y = -0.115;
mouseGroup.add(mouseShadow);

// Mouse Left (-X, +Z -> phi 0..PI/2) & Right (+X, +Z -> phi PI/2..PI) Click Highlights on EXPOSED front side!
const mouseLeftHighlight = new THREE.Mesh(
  new THREE.SphereGeometry(0.244, 24, 16, 0, Math.PI * 0.5, 0, Math.PI * 0.5),
  new THREE.MeshBasicMaterial({ color: 0x84cc16 })
);
mouseLeftHighlight.scale.set(1.0, 0.56, 1.08);
mouseLeftHighlight.visible = false;
mouseGroup.add(mouseLeftHighlight);

const mouseRightHighlight = new THREE.Mesh(
  new THREE.SphereGeometry(0.244, 24, 16, Math.PI * 0.5, Math.PI * 0.5, 0, Math.PI * 0.5),
  new THREE.MeshBasicMaterial({ color: 0x84cc16 })
);
mouseRightHighlight.scale.set(1.0, 0.56, 1.08);
mouseRightHighlight.visible = false;
mouseGroup.add(mouseRightHighlight);

// Scroll wheel slot on exposed front-center (+Z) so it's never covered by the cat's wrist!
const scrollWheel = new THREE.Mesh(
  new THREE.BoxGeometry(0.032, 0.044, 0.095),
  new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
);
scrollWheel.position.set(0, 0.125, 0.065);
mouseGroup.add(scrollWheel);

// 4B. Compact 3D 60% Mechanical Keyboard (Smaller footprint + crisp keycap legends!)
const keyboardGroup = new THREE.Group();
keyboardGroup.position.set(0.24, -0.96, 0.82);
keyboardGroup.rotation.set(0.30, 0.0, -0.045);
deskGroup.add(keyboardGroup);

// Keyboard dark charcoal chassis
const kbW = 2.02;
const kbD = 0.80;
const kbChassisGeo = new THREE.BoxGeometry(kbW, 0.12, kbD);
const kbChassisMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 });
const kbChassis = new THREE.Mesh(kbChassisGeo, kbChassisMat);
kbChassis.position.y = -0.04;
keyboardGroup.add(kbChassis);

const KEY_ROWS = [
  [
    { id: 'Escape', label: 'ESC', w: 1.15 }, { id: 'Digit1', label: '1', w: 1 },
    { id: 'Digit2', label: '2', w: 1 }, { id: 'Digit3', label: '3', w: 1 },
    { id: 'Digit4', label: '4', w: 1 }, { id: 'Digit5', label: '5', w: 1 },
    { id: 'Digit6', label: '6', w: 1 }, { id: 'Digit7', label: '7', w: 1 },
    { id: 'Digit8', label: '8', w: 1 }, { id: 'Digit9', label: '9', w: 1 },
    { id: 'Digit0', label: '0', w: 1 }, { id: 'Minus', label: '-', w: 1 },
    { id: 'Equal', label: '=', w: 1 }, { id: 'Backspace', label: '⌫', w: 1.85 }
  ],
  [
    { id: 'Tab', label: '⇥', w: 1.5 }, { id: 'KeyQ', label: 'Q', w: 1 },
    { id: 'KeyW', label: 'W', w: 1 }, { id: 'KeyE', label: 'E', w: 1 },
    { id: 'KeyR', label: 'R', w: 1 }, { id: 'KeyT', label: 'T', w: 1 },
    { id: 'KeyY', label: 'Y', w: 1 }, { id: 'KeyU', label: 'U', w: 1 },
    { id: 'KeyI', label: 'I', w: 1 }, { id: 'KeyO', label: 'O', w: 1 },
    { id: 'KeyP', label: 'P', w: 1 }, { id: 'BracketLeft', label: '[', w: 1 },
    { id: 'BracketRight', label: ']', w: 1 }, { id: 'Backslash', label: '\\', w: 1.5 }
  ],
  [
    { id: 'CapsLock', label: '⇪', w: 1.8, accent: 0xf59e0b },
    { id: 'KeyA', label: 'A', w: 1 }, { id: 'KeyS', label: 'S', w: 1 },
    { id: 'KeyD', label: 'D', w: 1 }, { id: 'KeyF', label: 'F', w: 1 },
    { id: 'KeyG', label: 'G', w: 1 }, { id: 'KeyH', label: 'H', w: 1 },
    { id: 'KeyJ', label: 'J', w: 1 }, { id: 'KeyK', label: 'K', w: 1 },
    { id: 'KeyL', label: 'L', w: 1 }, { id: 'Semicolon', label: ';', w: 1 },
    { id: 'Quote', label: "'", w: 1 }, { id: 'Enter', label: '↵', w: 2.2 }
  ],
  [
    { id: 'ShiftLeft', label: '⇧', w: 2.3 }, { id: 'KeyZ', label: 'Z', w: 1 },
    { id: 'KeyX', label: 'X', w: 1 }, { id: 'KeyC', label: 'C', w: 1 },
    { id: 'KeyV', label: 'V', w: 1 }, { id: 'KeyB', label: 'B', w: 1 },
    { id: 'KeyN', label: 'N', w: 1 }, { id: 'KeyM', label: 'M', w: 1 },
    { id: 'Comma', label: ',', w: 1 }, { id: 'Period', label: '.', w: 1 },
    { id: 'Slash', label: '/', w: 1 }, { id: 'ShiftRight', label: '⇧', w: 2.7 }
  ],
  [
    { id: 'ControlLeft', label: 'CTRL', w: 1.3 }, { id: 'MetaLeft', label: '⌘', w: 1.2 },
    { id: 'AltLeft', label: 'ALT', w: 1.3 }, { id: 'Space', label: '', w: 6.4 },
    { id: 'AltRight', label: 'ALT', w: 1.3 }, { id: 'ArrowLeft', label: '←', w: 1.2 },
    { id: 'ArrowDown', label: '↓', w: 1.2 }, { id: 'ControlRight', label: 'FN', w: 1.1, accent: 0xf59e0b }
  ]
];

const keyMap3D = new Map();
const allKeys3D = [];

const KB_THEMES = {
  classic: {
    chassis: 0x18181b, keyBg: '#f8fafc', keyBorder: '#cbd5e1', keyText: '#334155', keySide: 0xffffff,
    accBg: '#f59e0b', accBorder: '#d97706', accText: '#fffbeb', accSide: 0xf59e0b,
    actBg: '#a3e635', actBorder: '#65a30d', actSide: 0x84cc16, impact: 0xbef264
  },
  sakura: {
    chassis: 0xf472b6, keyBg: '#fff1f5', keyBorder: '#fbcfe8', keyText: '#be185d', keySide: 0xfce7f3,
    accBg: '#ec4899', accBorder: '#db2777', accText: '#ffffff', accSide: 0xec4899,
    actBg: '#f9a8d4', actBorder: '#ec4899', actSide: 0xf472b6, impact: 0xf9a8d4
  },
  candyPink: {
    chassis: 0xdb2777, keyBg: '#fbcfe8', keyBorder: '#f472b6', keyText: '#831843', keySide: 0xf9a8d4,
    accBg: '#ffffff', accBorder: '#f472b6', accText: '#be185d', accSide: 0xffffff,
    actBg: '#fde047', actBorder: '#eab308', actSide: 0xfacc15, impact: 0xf472b6
  },
  mint: {
    chassis: 0x10b981, keyBg: '#f0fdf4', keyBorder: '#a7f3d0', keyText: '#065f46', keySide: 0xecfdf5,
    accBg: '#34d399', accBorder: '#059669', accText: '#ffffff', accSide: 0x34d399,
    actBg: '#6ee7b7', actBorder: '#10b981', actSide: 0x34d399, impact: 0x6ee7b7
  },
  lavender: {
    chassis: 0x9333ea, keyBg: '#faf5ff', keyBorder: '#e9d5ff', keyText: '#6b21a8', keySide: 0xf3e8ff,
    accBg: '#c084fc', accBorder: '#9333ea', accText: '#ffffff', accSide: 0xc084fc,
    actBg: '#e879f9', actBorder: '#c026d3', actSide: 0xd946ef, impact: 0xd8b4fe
  },
  obsidian: {
    chassis: 0x09090b, keyBg: '#27272a', keyBorder: '#3f3f46', keyText: '#e4e4e7', keySide: 0x27272a,
    accBg: '#84cc16', accBorder: '#65a30d', accText: '#0f172a', accSide: 0x84cc16,
    actBg: '#a3e635', actBorder: '#bef264', actSide: 0xa3e635, impact: 0xa3e635
  }
};

const MOUSE_COLORS = {
  white: { body: 0xffffff, wheel: 0x475569, highlight: 0x84cc16 },
  pink:  { body: 0xfbcfe8, wheel: 0xdb2777, highlight: 0xec4899 },
  mint:  { body: 0xa7f3d0, wheel: 0x059669, highlight: 0x10b981 },
  black: { body: 0x27272a, wheel: 0xa3e635, highlight: 0x84cc16 }
};

const CAT_COATS = {
  black:  { base: 0x09090c, lit: 0x17171d, bodyRim: 0x64748b, limbRim: 0xe2e8f0, whisker: 0x94a3b8 },
  blue:   { base: 0x334155, lit: 0x475569, bodyRim: 0x94a3b8, limbRim: 0xe2e8f0, whisker: 0xcbd5e1 },
  cream:  { base: 0xe2e8f0, lit: 0xf8fafc, bodyRim: 0x94a3b8, limbRim: 0x94a3b8, whisker: 0x64748b },
  orange: { base: 0xc2410c, lit: 0xea580c, bodyRim: 0xfdba74, limbRim: 0xfed7aa, whisker: 0xfef3c7 }
};

const EYE_COLORS = {
  lime:   { dark: 0x9be02e, bright: 0xd2f85e },
  amber:  { dark: 0xd97706, bright: 0xfcd34d },
  sky:    { dark: 0x0284c7, bright: 0x7dd3fc },
  pink:   { dark: 0xdb2777, bright: 0xf9a8d4 },
  violet: { dark: 0x7c3aed, bright: 0xc4b5fd }
};

const whiteKeyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x334155, emissiveIntensity: 0.12, roughness: 0.35 });
const orangeKeyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x92400e, emissiveIntensity: 0.16, roughness: 0.40 });
const activeKeyMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x4d7c0f, emissiveIntensity: 0.35, roughness: 0.35 });

const kbTopTexCache = new Map();
function getKbKeyTopMaterial(label, isOrange, isActive, w, d, themeName = 'classic') {
  const th = KB_THEMES[themeName] || KB_THEMES.classic;
  const key = `${themeName}_${label}_${isOrange}_${isActive}_${w > d * 1.4 ? 'w' : 'n'}`;
  if (kbTopTexCache.has(key)) return kbTopTexCache.get(key);

  const cw = w > d * 1.4 ? 128 : 64;
  const ch = 64;
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const g = c.getContext('2d');

  if (isActive) {
    g.fillStyle = th.actBg;
  } else if (isOrange) {
    g.fillStyle = th.accBg;
  } else {
    g.fillStyle = th.keyBg;
  }
  g.fillRect(0, 0, cw, ch);

  // Subtle top bezel border for crisp miniature 3D keycap definition
  g.strokeStyle = isActive ? th.actBorder : (isOrange ? th.accBorder : th.keyBorder);
  g.lineWidth = 4;
  g.strokeRect(2, 2, cw - 4, ch - 4);

  if (label && label.trim().length > 0) {
    g.fillStyle = isOrange ? th.accText : th.keyText;
    const fontSize = label.length > 2 ? 17 : 26;
    g.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, cw / 2, ch / 2 + 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.38,
    emissive: isActive ? new THREE.Color(th.actSide) : new THREE.Color(0x1e293b),
    emissiveIntensity: isActive ? 0.25 : 0.06
  });
  kbTopTexCache.set(key, mat);
  return mat;
}

function build3DKeyboard() {
  const innerW = kbW - 0.12;
  const innerD = kbD - 0.10;
  const rowDepth = innerD / KEY_ROWS.length;

  for (let r = 0; r < KEY_ROWS.length; r++) {
    const row = KEY_ROWS[r];
    const totalUnits = row.reduce((acc, k) => acc + k.w, 0);
    const unitW = innerW / totalUnits;
    const z = -innerD / 2 + (r + 0.5) * rowDepth;

    let curU = 0;
    for (let c = 0; c < row.length; c++) {
      const k = row[c];
      const w = k.w * unitW - 0.018;
      const d = rowDepth - 0.020;
      const x = -innerW / 2 + (curU + k.w / 2) * unitW;
      curU += k.w;

      const geo = new THREE.BoxGeometry(w, 0.068, d);
      const isOrange = Boolean(k.accent);
      const sideMat = isOrange ? orangeKeyMat : whiteKeyMat;
      const topBase = getKbKeyTopMaterial(k.label, isOrange, false, w, d, 'classic');
      const topActive = getKbKeyTopMaterial(k.label, isOrange, true, w, d, 'classic');

      // Face 2 is +Y (top face with small keycap legend!)
      const baseMats = [sideMat, sideMat, topBase, sideMat, sideMat, sideMat];
      const activeMats = [activeKeyMat, activeKeyMat, topActive, activeKeyMat, activeKeyMat, activeKeyMat];
      const mesh = new THREE.Mesh(geo, baseMats);
      mesh.position.set(x, 0.036, z);
      keyboardGroup.add(mesh);

      const entry = {
        ...k,
        wLen: w,
        dLen: d,
        isOrange,
        mesh,
        baseMats,
        activeMats,
        localPos: new THREE.Vector3(x, 0.072, z),
        hand: x < 0.05 ? 'left' : 'right',
        row: r
      };
      keyMap3D.set(k.id, entry);
      allKeys3D.push(entry);
    }
  }
}

function applyKeyboardTheme(themeName) {
  const th = KB_THEMES[themeName] || KB_THEMES.classic;
  kbChassisMat.color.setHex(th.chassis);
  whiteKeyMat.color.setHex(th.keySide);
  orangeKeyMat.color.setHex(th.accSide);
  activeKeyMat.color.setHex(th.actSide);
  activeKeyMat.emissive.setHex(th.actSide);

  for (const k of allKeys3D) {
    const topBase = getKbKeyTopMaterial(k.label, k.isOrange, false, k.wLen, k.dLen, themeName);
    const topActive = getKbKeyTopMaterial(k.label, k.isOrange, true, k.wLen, k.dLen, themeName);
    k.baseMats[2] = topBase;
    k.activeMats[2] = topActive;
  }
}
build3DKeyboard();

// 4C. Tactile Keystroke Impact Bursts (glowing lime starburst rings right on struck keys!)
const keyImpacts = [];
const impactRingGeo = new THREE.RingGeometry(0.14, 0.23, 18);
impactRingGeo.rotateX(-Math.PI / 2);
const impactCrossGeo = new THREE.PlaneGeometry(0.42, 0.06);
impactCrossGeo.rotateX(-Math.PI / 2);

function spawnKeyImpact(localPos) {
  const th = KB_THEMES[userSettings.keyboardTheme] || KB_THEMES.classic;
  const grp = new THREE.Group();
  grp.position.set(localPos.x, 0.095, localPos.z);

  const ringMat = new THREE.MeshBasicMaterial({
    color: th.impact,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(impactRingGeo, ringMat);
  grp.add(ring);

  const rayMat = new THREE.MeshBasicMaterial({
    color: th.impact,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const ray1 = new THREE.Mesh(impactCrossGeo, rayMat);
  ray1.rotation.y = Math.PI / 4;
  const ray2 = new THREE.Mesh(impactCrossGeo, rayMat);
  ray2.rotation.y = -Math.PI / 4;
  grp.add(ray1, ray2);

  keyboardGroup.add(grp);
  keyImpacts.push({ grp, mats: [ringMat, rayMat], age: 0, maxAge: 13 });
}

// ============================================================================
// 5. 3D FLOATING POPPING KEYCAPS (WITH CRISP TEXTURED LETTER TOPS!)
// ============================================================================
const floatingCapsGroup = new THREE.Group();
scene.add(floatingCapsGroup);
const floatingCaps = [];
const keycapTextureCache = new Map();

function getKeycapTexture(label, isCaps, isSpace) {
  const key = `${label}_${isCaps}_${isSpace}`;
  if (keycapTextureCache.has(key)) return keycapTextureCache.get(key);

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');

  // White rounded square face
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#cbd5e1';
  g.lineWidth = 8;
  g.strokeRect(4, 4, 120, 120);

  if (isCaps) {
    // Green CapsLock LED indicator dot
    g.beginPath();
    g.arc(24, 24, 9, 0, Math.PI * 2);
    g.fillStyle = '#84cc16';
    g.fill();
    g.fillStyle = '#0f172a';
    g.font = 'bold 54px "Segoe UI", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('⇪', 64, 68);
  } else if (!isSpace) {
    g.fillStyle = '#0f172a';
    g.font = label.length > 2 ? 'bold 34px "Segoe UI", sans-serif' : 'bold 62px "Segoe UI", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 64, 66);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  keycapTextureCache.set(key, tex);
  return tex;
}

const capSideMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });

function spawnFloatingKeycap(keyInfo) {
  const label = keyInfo.label || '?';
  const isWide = keyInfo.isSpace || label === '␣' || label.length > 2;
  const isCaps = keyInfo.isCaps || label === '⇪';

  const w = isWide ? 0.30 : 0.21;
  const h = 0.19;
  const d = 0.09;

  const topTex = getKeycapTexture(keyInfo.isSpace ? '' : label, isCaps, Boolean(keyInfo.isSpace));
  const topMat = new THREE.MeshBasicMaterial({ map: topTex, transparent: true });
  const sideMatInst = capSideMat.clone();
  sideMatInst.transparent = true;

  // Box faces: +x, -x, +y, -y, +z (facing camera!), -z
  const mats = [sideMatInst, sideMatInst, sideMatInst, sideMatInst, topMat, sideMatInst];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);

  mesh.position.set(
    0.20 + (Math.random() - 0.35) * 0.72,
    -0.55 + (Math.random() - 0.5) * 0.06,
    1.14 + Math.random() * 0.08
  );

  floatingCapsGroup.add(mesh);

  // Pop gently upward & fade cleanly before ever falling back down!
  floatingCaps.push({
    mesh,
    mats,
    vx: (Math.random() - 0.3) * 0.014,
    vy: 0.018 + Math.random() * 0.008,
    vrotZ: (Math.random() - 0.5) * 0.015,
    vrotY: (Math.random() - 0.5) * 0.010,
    w,
    age: 0,
    maxAge: 42
  });

  if (floatingCaps.length > 7) {
    const old = floatingCaps.shift();
    floatingCapsGroup.remove(old.mesh);
    old.mesh.geometry.dispose();
  }
}

// ============================================================================
// 6. INTERACTIVE STATE, INPUT HOOKS & 3D RAYCASTER HIT-TEST
// ============================================================================
const state = {
  normX: 0.5,
  normY: 0.5,
  relX: 0,
  relY: 0,
  winX: W / 2,
  winY: H / 2,
  hasInitialMouse: false,

  // Live2D-style 3D Rotation & Posture Springs
  rig: {
    yaw: 0, vYaw: 0, targetYaw: 0,
    pitch: 0, vPitch: 0, targetPitch: 0,
    roll: 0, vRoll: 0, targetRoll: 0,
    bodyX: 0, vBodyX: 0, targetBodyX: 0,
    bodyY: 0, vBodyY: 0, targetBodyY: 0
  },

  // 3D Vertex Jelly Deformation Spring
  jelly: {
    x: 0, vx: 0, targetX: 0,
    y: 0, vy: 0, targetY: 0
  },

  // Eye Gaze & Eyelids
  gazeX: 0, gazeY: 0,
  targetGazeX: 0, targetGazeY: 0,
  typingLookTimer: 0,
  typingFocusX: 0,
  typingFocusY: -0.65,
  squintAmount: 0,
  upperLidPress: 0,
  blinkTimer: 160,
  blinkAmount: 0,

  // Virtual mouse
  mouseOffset: new THREE.Vector2(0, 0),
  mouseTargetOffset: new THREE.Vector2(0, 0),
  mouseLeftDown: false,
  mouseRightDown: false,
  mouseActiveTimer: 0,

  // Hover / Petting / Dragging
  isOverCat: false,
  isOverProp: false,
  isPetting: false,
  isDraggingWindow: false,
  globalAltDown: false,
  dragLastScreen: { x: 0, y: 0 },
  petIntensity: 0,

  activeKeys: new Map(),

  // 3D Paw Targets (in catRoot local space — right paw tucked playfully on belly with curved silver rim!)
  rightPaw: {
    pos: new THREE.Vector3(-0.34, -0.36, 0.78),
    target: new THREE.Vector3(-0.34, -0.36, 0.78),
    rest: new THREE.Vector3(-0.34, -0.36, 0.78),
    mode: 'rest',
    timer: 0,
    strikeAge: 99,
    hitPop: 0
  },
  leftPaw: {
    pos: new THREE.Vector3(0.24, -0.66, 0.76),
    target: new THREE.Vector3(0.24, -0.66, 0.76),
    rest: new THREE.Vector3(0.24, -0.66, 0.76),
    isTyping: false,
    timer: 0,
    strikeAge: 99,
    hitPop: 0
  },

  lastSpaceHand: 'left',
  kbRecoil: { y: 0, vy: 0, tiltX: 0, vTiltX: 0, tiltZ: 0, vTiltZ: 0 },
  tailPhase: 0,
  breathPhase: 0
};

// Trigger 3D key depression, instant-kick-and-slam paw strike, keyboard recoil & impact burst
const tempWorldVec = new THREE.Vector3();
function triggerKeyPress(data) {
  const k = keyMap3D.get(data.id) ||
    allKeys3D.find((item) => item.label === data.label) ||
    allKeys3D[Math.floor(Math.random() * allKeys3D.length)];

  state.activeKeys.set(k.id, performance.now() + 140);

  if (!data.isRepeat) {
    window.catSound.playKeyClick(data.isSpace || k.id === 'Space');
    if (userSettings.showImpactGlow) {
      spawnKeyImpact(k.localPos);
    }
    if (userSettings.showFloatingKeys) {
      spawnFloatingKeycap({
        label: data.label || k.label,
        isSpace: data.isSpace || k.id === 'Space',
        isCaps: data.isCaps || k.id === 'CapsLock'
      });
    }
  }

  // Convert key's 3D world position into catRoot's local space so the paw lands SQUARELY on the 3D key!
  keyboardGroup.updateMatrixWorld(true);
  catRoot.updateMatrixWorld(true);
  tempWorldVec.copy(k.localPos).applyMatrix4(keyboardGroup.matrixWorld);
  catRoot.worldToLocal(tempWorldVec);
  tempWorldVec.y += 0.08;
  tempWorldVec.z += 0.04;

  // Determine which hand hits this key (Space alternates hands cleanly; typing overrides idle mouse hover)
  let useRightHand = k.hand === 'left';
  if (k.id === 'Space') {
    state.lastSpaceHand = state.lastSpaceHand === 'left' ? 'right' : 'left';
    useRightHand = state.lastSpaceHand === 'left';
  }
  const holdingMouseBtn = state.mouseLeftDown || state.mouseRightDown;
  if (useRightHand && !holdingMouseBtn) {
    state.mouseActiveTimer = 0; // Pull right paw off idle mouse to reach & hit left-half keys!
  }

  if (useRightHand && !holdingMouseBtn) {
    // Immediate upward windup kick on Frame 0 so every tap clearly lifts and slams!
    state.rightPaw.pos.y = Math.max(state.rightPaw.pos.y, tempWorldVec.y + 0.24);
    state.rightPaw.target.copy(tempWorldVec);
    state.rightPaw.mode = 'typing';
    state.rightPaw.timer = 16;
    state.rightPaw.strikeAge = 0;
    state.rightPaw.hitPop = 1;
  } else {
    state.leftPaw.pos.y = Math.max(state.leftPaw.pos.y, tempWorldVec.y + 0.24);
    state.leftPaw.target.copy(tempWorldVec);
    state.leftPaw.isTyping = true;
    state.leftPaw.timer = 16;
    state.leftPaw.strikeAge = 0;
    state.leftPaw.hitPop = 1;
  }

  // Look strongly down & across at the exact key being hit
  const keyRelX = Math.max(-1.0, Math.min(1.0, k.localPos.x / 0.92));
  state.typingFocusX = keyRelX * 0.96;
  state.typingFocusY = -0.78 - (k.row / 5) * 0.22;
  state.typingLookTimer = 26;

  // Mechanical keyboard thump recoil & lively cat head/body strike impulse
  state.kbRecoil.vy -= 0.036;
  state.kbRecoil.vTiltX += 0.026;
  state.kbRecoil.vTiltZ -= keyRelX * 0.024;

  state.rig.vPitch += 0.075;
  state.rig.vYaw += keyRelX * 0.11;
  state.rig.vRoll -= keyRelX * 0.038;
  state.rig.vBodyY -= 0.042;
  state.rig.vBodyX += keyRelX * 0.045;
}

// 3D Raycaster Hit-Detection for seamless transparent click-through
const raycaster = new THREE.Raycaster();
const ndcPointer = new THREE.Vector2();
let lastIgnoreMouseState = true;

function updateClickThrough(winX, winY) {
  ndcPointer.set((winX / W) * 2 - 1, -(winY / H) * 2 + 1);
  raycaster.setFromCamera(ndcPointer, camera);

  const catHits = raycaster.intersectObject(catRoot, true);
  const propHits = raycaster.intersectObjects([keyboardGroup, mouseGroup], true);

  const overCat = catHits.length > 0;
  const overProp = !overCat && propHits.length > 0;

  state.isOverCat = overCat;
  state.isOverProp = overProp;

  // Capture on cat (for Right-Drag petting / Alt+Right-Drag move), or on props when Alt is held!
  // Never intercept plain hover or show drag cursor just from moving mouse onto the cat.
  const shouldCapture = overCat || (overProp && state.globalAltDown) || state.isPetting || state.isDraggingWindow;

  if (shouldCapture !== !lastIgnoreMouseState) {
    lastIgnoreMouseState = !shouldCapture;
    if (window.bongoAPI) {
      window.bongoAPI.setIgnoreMouse(lastIgnoreMouseState);
    }
  }

  if (state.isDraggingWindow) {
    canvas.style.cursor = 'move';
  } else if (state.isPetting) {
    canvas.style.cursor = HAND_OPEN_CURSOR;
  } else {
    canvas.style.cursor = 'default';
  }
}

window.addEventListener('contextmenu', (e) => e.preventDefault());

// Input Listeners
let lastPetX = 0;
let lastPetY = 0;

if (window.bongoAPI) {
  window.bongoAPI.onGlobalMouseMove((data) => {
    const prevNormX = state.normX;
    const prevNormY = state.normY;
    state.normX = data.normX;
    state.normY = data.normY;
    state.winX = data.winX;
    state.winY = data.winY;

    if (typeof data.relX === 'number') {
      state.relX = data.relX;
      state.relY = data.relY;
    } else {
      state.relX = Math.max(-1, Math.min(1, (data.winX - W / 2) / 300));
      state.relY = Math.max(-1, Math.min(1, (data.winY - H * 0.42) / 300));
    }

    updateClickThrough(data.winX, data.winY);

    if (!state.hasInitialMouse) {
      state.hasInitialMouse = true;
      return; // Stay in peaceful sitting pose on initial frame until mouse actually moves
    }

    const moveDelta = Math.hypot(data.normX - prevNormX, data.normY - prevNormY);
    if (moveDelta > 0.0006 && !state.isPetting && !state.isDraggingWindow) {
      state.mouseActiveTimer = 70;
      const clampedNx = Math.max(0, Math.min(1, data.normX));
      const clampedNy = Math.max(0, Math.min(1, data.normY));
      state.mouseTargetOffset.set((clampedNx - 0.5) * 0.44, -(clampedNy - 0.5) * 0.24);
    }
  });

  window.bongoAPI.onGlobalKeyDown((data) => triggerKeyPress(data));
  window.bongoAPI.onGlobalKeyUp((data) => state.activeKeys.delete(data.id));
  if (window.bongoAPI.onAltState) {
    window.bongoAPI.onAltState((down) => {
      state.globalAltDown = Boolean(down);
      updateClickThrough(state.winX, state.winY);
    });
  }
  window.bongoAPI.onGlobalMouseDown((data) => {
    if (state.isPetting || state.isDraggingWindow || (state.isOverCat && data.button === 1)) return;
    state.mouseActiveTimer = 80;
    if (data.button === 1) state.mouseLeftDown = true;
    if (data.button === 2) state.mouseRightDown = true;
  });
  window.bongoAPI.onGlobalMouseUp((data) => {
    if (data.button === 1) state.mouseLeftDown = false;
    if (data.button === 2) state.mouseRightDown = false;
  });
}

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // Only Left Mouse Button interacts with cat or Alt+Left-Drags position!

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  updateClickThrough(x, y);

  const altHeld = e.altKey || state.globalAltDown;
  if (altHeld && (state.isOverCat || state.isOverProp) && !userSettings.lockPosition) {
    state.isDraggingWindow = true;
    state.dragLastScreen = { x: e.screenX, y: e.screenY };
    canvas.style.cursor = 'move';
  } else if (state.isOverCat && !altHeld) {
    state.isPetting = true;
    state.mouseLeftDown = false;
    state.mouseActiveTimer = 0;
    lastPetX = x;
    lastPetY = y;
    canvas.style.cursor = HAND_OPEN_CURSOR;
  }
});

window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (!window.bongoAPI) {
    state.winX = x;
    state.winY = y;
    state.normX = x / W;
    state.normY = y / H;
    state.relX = Math.max(-1, Math.min(1, (x - W / 2) / 220));
    state.relY = Math.max(-1, Math.min(1, (y - H * 0.42) / 220));
    state.mouseTargetOffset.set((state.normX - 0.5) * 0.44, -(state.normY - 0.5) * 0.24);
    state.mouseActiveTimer = 65;
    updateClickThrough(x, y);
  }

  if (state.isDraggingWindow && window.bongoAPI) {
    const dx = e.screenX - state.dragLastScreen.x;
    const dy = e.screenY - state.dragLastScreen.y;
    state.dragLastScreen = { x: e.screenX, y: e.screenY };
    window.bongoAPI.moveWindow(dx, dy);
    return;
  }

  if (state.isPetting) {
    const dx = x - lastPetX;
    const dy = y - lastPetY;
    const speed = Math.hypot(dx, dy);
    lastPetX = x;
    lastPetY = y;

    // Gentle cushion give while petting (never violently pulls or shakes the cat!)
    state.jelly.vx += dx * 0.0012;
    state.jelly.vy -= dy * 0.0010;
    state.petIntensity = Math.min(35, state.petIntensity + Math.max(0.4, speed * 0.16));

    if (speed > 2.5) window.catSound.playPurrTick(state.petIntensity);
    if (state.petIntensity > 22 && speed > 14) window.catSound.playMeow();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0 || e.buttons === 0) {
    state.isPetting = false;
    state.isDraggingWindow = false;
    canvas.style.cursor = 'default';
  }
});

window.addEventListener('keydown', (e) => {
  if (window.bongoAPI) return;
  if (e.key === 'Alt') state.globalAltDown = true;
  triggerKeyPress({
    id: e.code,
    label: e.key.length === 1 ? e.key.toUpperCase() : e.code.replace('Key', ''),
    isSpace: e.code === 'Space',
    isCaps: e.code === 'CapsLock',
    isRepeat: e.repeat
  });
});

window.addEventListener('keyup', (e) => {
  if (!window.bongoAPI && e.key === 'Alt') state.globalAltDown = false;
});

function playDemoTyping() {
  const demoSeq = ['KeyJ', 'KeyF', 'KeyS', 'KeyD', 'KeyA', 'KeyN', 'KeyI', 'KeyE', 'KeyO', 'KeyK', 'KeyP', 'Space', 'CapsLock', 'KeyL', 'KeyQ'];
  let step = 0;
  const timer = setInterval(() => {
    const id = demoSeq[step % demoSeq.length];
    const k = keyMap3D.get(id);
    if (k) {
      triggerKeyPress({
        id: k.id,
        label: k.label || '␣',
        isSpace: k.id === 'Space',
        isCaps: k.id === 'CapsLock',
        isRepeat: false
      });
    }
    step++;
    if (step >= 26) clearInterval(timer);
  }, 85);
}

function applySettings(cfg) {
  if (!cfg) return;
  Object.assign(userSettings, cfg);

  applyKeyboardTheme(userSettings.keyboardTheme || 'classic');

  const mc = MOUSE_COLORS[userSettings.mouseColor] || MOUSE_COLORS.white;
  pebbleBodyMat.color.setHex(mc.body);
  scrollWheel.material.color.setHex(mc.wheel);
  mouseLeftHighlight.material.color.setHex(mc.highlight);
  mouseRightHighlight.material.color.setHex(mc.highlight);

  const coat = CAT_COATS[userSettings.catCoat] || CAT_COATS.black;
  [bodyFurMat, eyelidMat].forEach((m) => {
    m.uniforms.uBaseColor.value.setHex(coat.base);
    m.uniforms.uLitColor.value.setHex(coat.lit);
    m.uniforms.uRimColor.value.setHex(coat.bodyRim);
  });
  [limbFurMat, armFurMat].forEach((m) => {
    m.uniforms.uBaseColor.value.setHex(coat.base);
    m.uniforms.uLitColor.value.setHex(coat.lit);
    m.uniforms.uRimColor.value.setHex(coat.limbRim);
  });
  whiskerMat.color.setHex(coat.whisker);

  const eye = EYE_COLORS[userSettings.eyeColor] || EYE_COLORS.lime;
  irisMat.uniforms.uDarkLime.value.setHex(eye.dark);
  irisMat.uniforms.uBrightLime.value.setHex(eye.bright);

  window.catSound.muted = !userSettings.soundEnabled;
}

if (window.bongoAPI) {
  if (window.bongoAPI.getSettings) {
    window.bongoAPI.getSettings().then(applySettings);
  }
  if (window.bongoAPI.onSettingsChanged) {
    window.bongoAPI.onSettingsChanged(applySettings);
  }
  if (window.bongoAPI.onTriggerDemo) {
    window.bongoAPI.onTriggerDemo(playDemoTyping);
  }
  if (window.bongoAPI.onWindowResized) {
    window.bongoAPI.onWindowResized(({ width, height }) => {
      if (!width || !height) return;
      W = width;
      H = height;
      canvas.width = W;
      canvas.height = H;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    });
  }
}

// ============================================================================
// 7. 3D PHYSICS, IK ARM SOLVER & REAL-TIME VERTEX DEFORMATION LOOP
// ============================================================================
const tempSh = new THREE.Vector3();
const tempEl = new THREE.Vector3();
const tempMouseWorld = new THREE.Vector3();

function update3DScene() {
  const now = performance.now();
  state.breathPhase += 0.04;
  const isTypingNow = state.typingLookTimer > 0;

  // -------------------------------------------------------------------------
  // A. 3D POSTURE TARGETS (Mouse Lean vs Typing Hunch vs Petting Pull)
  // -------------------------------------------------------------------------
  let tYaw = 0;
  let tPitch = 0;
  let tRoll = 0;
  let tBodyX = 0;
  let tBodyY = Math.sin(state.breathPhase) * 0.015;

  if (state.isPetting) {
    // Cozy blissful enjoyment: lean gently up & slightly tilted into your palm while purring calmly (zero ragdoll shake!)
    const sideBias = Math.max(-1, Math.min(1, (state.winX - W / 2) / 140));
    const purrSway = Math.sin(now * 0.0045) * 0.045;
    tYaw = sideBias * 0.14;
    tPitch = -0.07; // Slight upward tilt enjoying chin/head rubs!
    tRoll = sideBias * 0.14 + purrSway;
    tBodyX = 0;
    tBodyY += Math.sin(now * 0.024) * 0.005; // Soft rhythmic purr hum
    state.jelly.targetX = sideBias * 0.025;
    state.jelly.targetY = -0.025;
  } else {
    state.jelly.targetX = 0;
    state.jelly.targetY = 0;

    if (state.rightPaw.mode === 'mouse') {
      // Gentle lean toward mouse while letting head still track cursor freely across screens
      tBodyX -= 0.05 - state.mouseOffset.x * 0.16;
      tYaw -= 0.08 - state.mouseOffset.x * 0.24;
      tRoll += 0.03;
    }

    if (isTypingNow) {
      tYaw += state.typingFocusX * 0.48;
      tPitch += 0.19;
      tRoll -= state.typingFocusX * 0.14;
      tBodyX += state.typingFocusX * 0.12;
      tBodyY -= 0.035;
    } else {
      tYaw += state.relX * 0.58;
      tPitch += state.relY * 0.36;
      tRoll -= state.relX * 0.15;
      tBodyX += state.relX * 0.12;
    }
  }

  const r = state.rig;
  r.targetYaw = Math.max(-0.82, Math.min(0.82, tYaw));
  r.targetPitch = Math.max(-0.44, Math.min(0.46, tPitch));
  r.targetRoll = Math.max(-0.38, Math.min(0.38, tRoll));
  r.targetBodyX = Math.max(-0.42, Math.min(0.42, tBodyX));
  r.targetBodyY = Math.max(-0.22, Math.min(0.22, tBodyY));

  r.vYaw = (r.vYaw + (r.targetYaw - r.yaw) * 0.16) * 0.75;
  r.yaw += r.vYaw;
  r.vPitch = (r.vPitch + (r.targetPitch - r.pitch) * 0.16) * 0.75;
  r.pitch += r.vPitch;
  r.vRoll = (r.vRoll + (r.targetRoll - r.roll) * 0.15) * 0.75;
  r.roll += r.vRoll;
  r.vBodyX = (r.vBodyX + (r.targetBodyX - r.bodyX) * 0.14) * 0.77;
  r.bodyX += r.vBodyX;
  r.vBodyY = (r.vBodyY + (r.targetBodyY - r.bodyY) * 0.15) * 0.77;
  r.bodyY += r.vBodyY;

  catRoot.position.x = 0.18 + r.bodyX;
  catRoot.position.y = 0.02 + r.bodyY;
  catRoot.rotation.z = -r.bodyX * 0.18;

  headPivot.rotation.set(r.pitch, r.yaw, r.roll);

  // -------------------------------------------------------------------------
  // B. REAL-TIME 3D VERTEX JELLY DEFORMATION ON HEAD MESH (Mochi Rubbing!)
  // -------------------------------------------------------------------------
  const j = state.jelly;
  j.vx = (j.vx + (j.targetX - j.x) * 0.22) * 0.72;
  j.x += j.vx;
  j.vy = (j.vy + (j.targetY - j.y) * 0.22) * 0.72;
  j.y += j.vy;

  if (Math.abs(j.x) > 0.001 || Math.abs(j.y) > 0.001 || Math.abs(j.vx) > 0.001) {
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = headBasePositions[i * 3];
      const by = headBasePositions[i * 3 + 1];
      const bz = headBasePositions[i * 3 + 2];

      // Upper & front vertices deform most smoothly; neck base stays anchored!
      const anchorWeight = Math.max(0, Math.min(1, (by + 0.55) / 1.1));
      const frontWeight = 0.55 + Math.max(0, bz) * 0.65;
      const w = anchorWeight * frontWeight;

      pos.setXYZ(
        i,
        bx + j.x * w,
        by + j.y * w,
        bz
      );
    }
    pos.needsUpdate = true;
    headGeo.computeVertexNormals();

    // Ears follow head jelly wobble slightly
    leftEar.position.set(-0.33 + j.x * 0.9, 0.37 + j.y * 0.9, -0.02);
    rightEar.position.set(0.33 + j.x * 0.9, 0.37 + j.y * 0.9, -0.02);
  }

  // -------------------------------------------------------------------------
  // C. 3D EYE GAZE ROTATION & 3D EYELID SQUINT / BLINK
  // -------------------------------------------------------------------------
  if (state.typingLookTimer > 0) {
    state.typingLookTimer--;
    state.targetGazeX = state.typingFocusX;
    state.targetGazeY = state.typingFocusY;
  } else {
    state.targetGazeX = state.relX;
    state.targetGazeY = -state.relY; // screen Y down = look down (-Y)
  }

  state.gazeX += (state.targetGazeX - state.gazeX) * 0.44;
  state.gazeY += (state.targetGazeY - state.gazeY) * 0.44;

  // Wide, expressive 3D pupil sweep across the chartreuse eyeballs!
  const pRotY = Math.max(-0.78, Math.min(0.78, state.gazeX * 0.78));
  const pRotX = Math.max(-0.68, Math.min(0.68, -state.gazeY * 0.68));
  leftEye3D.pupilPivot.rotation.set(pRotX, pRotY, 0);
  rightEye3D.pupilPivot.rotation.set(pRotX, pRotY, 0);

  // Eyelid state: peaceful blissful squint while being petted (`isPetting`), or natural blink
  state.petIntensity = Math.max(0, state.petIntensity - 0.18);
  const wantSquint = state.isPetting ? 1 : 0;
  state.squintAmount += (wantSquint - state.squintAmount) * 0.18;
  state.upperLidPress *= 0.8;

  // Soft rosy blush & gentle happy relaxed eye angle while squinting!
  blushMat.opacity = state.squintAmount * 0.42;
  leftEye3D.eyeSocket.rotation.z = 0.04 - state.squintAmount * 0.09;
  rightEye3D.eyeSocket.rotation.z = -0.04 + state.squintAmount * 0.09;

  state.blinkTimer--;
  if (state.blinkTimer <= 0) {
    state.blinkAmount = 1;
    state.blinkTimer = 170 + Math.floor(Math.random() * 190);
  }
  if (state.blinkAmount > 0) {
    state.blinkAmount = Math.max(0, state.blinkAmount - 0.18);
  }

  // Compute exact 3D upper & lower eyelid closure angles (-1.52 = wide open, 0.0 = cozy slit)
  const squintUpper = -1.52 + state.squintAmount * 1.38;
  const squintLower = 1.52 - state.squintAmount * 1.36;

  const upperRot = Math.min(0.02, squintUpper + state.blinkAmount * (0.0 - squintUpper));
  const lowerRot = Math.max(-0.02, squintLower - state.blinkAmount * squintLower);

  leftEye3D.upperLidPivot.rotation.x = upperRot;
  rightEye3D.upperLidPivot.rotation.x = upperRot;
  leftEye3D.lowerLidPivot.rotation.x = lowerRot;
  rightEye3D.lowerLidPivot.rotation.x = lowerRot;

  // -------------------------------------------------------------------------
  // D. VIRTUAL 3D MOUSE & 3D IK SHORT STUBBY ARMS
  // -------------------------------------------------------------------------
  state.mouseOffset.lerp(state.mouseTargetOffset, 0.28);
  mouseGroup.position.set(
    mouseBasePos.x + state.mouseOffset.x,
    mouseBasePos.y + state.mouseOffset.y * 0.35,
    mouseBasePos.z - state.mouseOffset.y * 0.55
  );
  mouseLeftHighlight.visible = state.mouseLeftDown;
  mouseRightHighlight.visible = state.mouseRightDown;

  if (state.mouseActiveTimer > 0) state.mouseActiveTimer--;

  // Helper to compute crisp lift-and-slam strike trajectory + paw squash impact!
  const strikeGoal = new THREE.Vector3();

  // Left arm (viewer right)
  if (state.leftPaw.timer > 0) {
    state.leftPaw.timer--;
    state.leftPaw.strikeAge++;
    strikeGoal.copy(state.leftPaw.target);
    if (state.leftPaw.strikeAge === 1) {
      // High fast reach directly over the target key
      strikeGoal.y += 0.22;
      state.leftPaw.pos.lerp(strikeGoal, 0.82);
      leftArm3D.pawMesh.scale.set(0.92, 1.15, 0.94);
    } else if (state.leftPaw.strikeAge === 2) {
      // SLAM impact frame down into the key!
      strikeGoal.y -= 0.03;
      state.leftPaw.pos.lerp(strikeGoal, 0.92);
      leftArm3D.pawMesh.scale.set(1.24, 0.72, 1.18);
    } else {
      state.leftPaw.pos.lerp(strikeGoal, 0.76);
      leftArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    }
  } else {
    state.leftPaw.isTyping = false;
    state.leftPaw.target.copy(state.leftPaw.rest);
    state.leftPaw.pos.lerp(state.leftPaw.target, 0.24);
    leftArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
  }
  state.leftPaw.hitPop *= 0.72;

  // Right arm (viewer left)
  if (state.rightPaw.timer > 0) {
    state.rightPaw.timer--;
    state.rightPaw.strikeAge++;
    state.rightPaw.mode = 'typing';
    strikeGoal.copy(state.rightPaw.target);
    if (state.rightPaw.strikeAge === 1) {
      strikeGoal.y += 0.22;
      state.rightPaw.pos.lerp(strikeGoal, 0.82);
      rightArm3D.pawMesh.scale.set(0.92, 1.15, 0.94);
    } else if (state.rightPaw.strikeAge === 2) {
      strikeGoal.y -= 0.03;
      state.rightPaw.pos.lerp(strikeGoal, 0.92);
      rightArm3D.pawMesh.scale.set(1.24, 0.72, 1.18);
    } else {
      state.rightPaw.pos.lerp(strikeGoal, 0.76);
      rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    }
  } else if (state.mouseActiveTimer > 0 || state.mouseLeftDown || state.mouseRightDown) {
    state.rightPaw.mode = 'mouse';
    mouseGroup.updateMatrixWorld(true);
    catRoot.updateMatrixWorld(true);
    tempMouseWorld.copy(mouseGroup.position);
    catRoot.worldToLocal(tempMouseWorld);
    tempMouseWorld.x += 0.02;
    tempMouseWorld.y += 0.13;
    tempMouseWorld.z -= 0.07; // Grip upper-back of pebble mouse so crisp white front remains visible!
    state.rightPaw.target.copy(tempMouseWorld);
    state.rightPaw.pos.lerp(state.rightPaw.target, 0.40);
    rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
  } else {
    state.rightPaw.mode = 'rest';
    state.rightPaw.target.copy(state.rightPaw.rest);
    state.rightPaw.pos.lerp(state.rightPaw.target, 0.24);
    rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
  }
  state.rightPaw.hitPop *= 0.72;

  // Solve short chubby 3D IK arms: continuous outer-shoulder slope onto mouse, mid-chest reach for keys!
  if (state.rightPaw.mode === 'mouse') {
    tempSh.set(-0.50, 0.14, 0.14);
    tempEl.set(
      (tempSh.x + state.rightPaw.pos.x) * 0.5 - 0.03,
      (tempSh.y + state.rightPaw.pos.y) * 0.5 + 0.01,
      (tempSh.z + state.rightPaw.pos.z) * 0.5 + 0.04
    );
  } else {
    const rightTyping = state.rightPaw.mode === 'typing';
    tempSh.set(rightTyping ? -0.36 : -0.40, rightTyping ? -0.14 : -0.02, rightTyping ? 0.44 : 0.48);
    tempEl.set(
      (tempSh.x + state.rightPaw.pos.x) * 0.5 + (rightTyping ? -0.03 : -0.14),
      (tempSh.y + state.rightPaw.pos.y) * 0.5 + (rightTyping ? 0.03 : -0.08) + state.rightPaw.hitPop * 0.10,
      (tempSh.z + state.rightPaw.pos.z) * 0.5 + (rightTyping ? 0.10 : 0.18)
    );
  }
  rightArm3D.updateArm(tempSh, tempEl, state.rightPaw.pos);

  const leftReaching = state.leftPaw.isTyping;
  tempSh.set(leftReaching ? 0.34 : 0.38, leftReaching ? -0.14 : -0.02, leftReaching ? 0.44 : 0.48);
  tempEl.set(
    (tempSh.x + state.leftPaw.pos.x) * 0.5 + (leftReaching ? 0.02 : 0.06),
    (tempSh.y + state.leftPaw.pos.y) * 0.5 + (leftReaching ? 0.03 : -0.04) + state.leftPaw.hitPop * 0.10,
    (tempSh.z + state.leftPaw.pos.z) * 0.5 + (leftReaching ? 0.10 : 0.18)
  );
  leftArm3D.updateArm(tempSh, tempEl, state.leftPaw.pos);

  // -------------------------------------------------------------------------
  // E. 3D KEYBOARD RECOIL, KEY DEPRESSION, IMPACT SPARKLES, TAIL & FLOATING CAPS
  // -------------------------------------------------------------------------
  const kb = state.kbRecoil;
  kb.vy = (kb.vy - kb.y * 0.42) * 0.62;
  kb.y += kb.vy;
  kb.vTiltX = (kb.vTiltX - kb.tiltX * 0.42) * 0.62;
  kb.tiltX += kb.vTiltX;
  kb.vTiltZ = (kb.vTiltZ - kb.tiltZ * 0.42) * 0.62;
  kb.tiltZ += kb.vTiltZ;

  keyboardGroup.position.y = -0.96 + kb.y;
  keyboardGroup.rotation.set(0.30 + kb.tiltX, 0.0, -0.045 + kb.tiltZ);

  for (const [kId, exp] of state.activeKeys.entries()) {
    if (now > exp) state.activeKeys.delete(kId);
  }
  for (const k of allKeys3D) {
    const isPressed = state.activeKeys.has(k.id);
    k.mesh.material = isPressed ? k.activeMats : k.baseMats;
    k.mesh.position.y = isPressed ? -0.004 : 0.036;
  }

  for (let i = keyImpacts.length - 1; i >= 0; i--) {
    const imp = keyImpacts[i];
    imp.age++;
    const p = imp.age / imp.maxAge;
    const s = 0.55 + p * 1.45;
    imp.grp.scale.set(s, s, s);
    imp.grp.rotation.y += 0.12;
    const alpha = Math.max(0, 1 - p);
    for (const m of imp.mats) m.opacity = alpha;
    if (imp.age >= imp.maxAge) {
      keyboardGroup.remove(imp.grp);
      keyImpacts.splice(i, 1);
    }
  }

  // Organic tail wag
  state.tailPhase += 0.048 + state.petIntensity * 0.01 + (isTypingNow ? 0.03 : 0);
  const wag = Math.sin(state.tailPhase) * 0.12;
  tailMesh.rotation.z = wag * 0.45;
  tailTip.position.set(
    tailBasePts[3].x - wag * 0.08,
    tailBasePts[3].y + wag * 0.55,
    tailBasePts[3].z
  );

  // 3D floating keycap physics (pops upward smoothly & fades out without dropping back down!)
  for (let i = floatingCaps.length - 1; i >= 0; i--) {
    const c = floatingCaps[i];
    c.age++;
    c.vx *= 0.96;
    c.vy *= 0.93;
    c.mesh.position.x += c.vx;
    c.mesh.position.y += c.vy;
    c.mesh.rotation.z += c.vrotZ;
    c.mesh.rotation.y += c.vrotY;

    if (c.age > c.maxAge - 20) {
      const alpha = Math.max(0, (c.maxAge - c.age) / 20);
      for (const m of c.mats) m.opacity = alpha;
    }
    if (c.age >= c.maxAge) {
      floatingCapsGroup.remove(c.mesh);
      c.mesh.geometry.dispose();
      floatingCaps.splice(i, 1);
    }
  }
}

// ============================================================================
// 8. ANIMATION LOOP
// ============================================================================
function animate() {
  update3DScene();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Boot loop
requestAnimationFrame(animate);
