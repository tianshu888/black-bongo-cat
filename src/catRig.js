import * as THREE from 'three';

export const CAT_COATS = {
  black:  { base: 0x09090c, lit: 0x17171d, bodyRim: 0x64748b, limbRim: 0xe2e8f0, whisker: 0x94a3b8 },
  blue:   { base: 0x334155, lit: 0x475569, bodyRim: 0x94a3b8, limbRim: 0xe2e8f0, whisker: 0xcbd5e1 },
  cream:  { base: 0xe2e8f0, lit: 0xf8fafc, bodyRim: 0x94a3b8, limbRim: 0x94a3b8, whisker: 0x64748b },
  orange: { base: 0xc2410c, lit: 0xea580c, bodyRim: 0xfdba74, limbRim: 0xfed7aa, whisker: 0xfef3c7 }
};

export const EYE_COLORS = {
  lime:   { dark: 0x9be02e, bright: 0xd2f85e },
  amber:  { dark: 0xd97706, bright: 0xfcd34d },
  sky:    { dark: 0x0284c7, bright: 0x7dd3fc },
  pink:   { dark: 0xdb2777, bright: 0xf9a8d4 },
  violet: { dark: 0x7c3aed, bright: 0xc4b5fd }
};

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

        float ndl = dot(WN, uLightDir) * 0.5 + 0.5;
        float shade = smoothstep(0.24, 0.88, ndl);
        vec3 col = mix(uBaseColor, uLitColor, shade);

        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float rim = smoothstep(uRimStart, uRimEnd, 1.0 - ndv);
        float rimFade = mix(1.0, smoothstep(0.18, 0.52, vUv.y), uFadeUpperRim);
        col = mix(col, uRimColor, rim * uRimStrength * rimFade);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
}

export function createCatRig(scene) {
  const bodyFurMat = createVelvetBlackMaterial({
    rimStrength: 0.03, rimStart: 0.80, rimEnd: 0.98,
    baseHex: 0x09090c, litHex: 0x17171d, rimHex: 0x64748b
  });

  const limbFurMat = createVelvetBlackMaterial({
    rimStrength: 0.72, rimStart: 0.70, rimEnd: 0.93,
    baseHex: 0x0a0a0e, litHex: 0x18181f, rimHex: 0xe2e8f0
  });

  const armFurMat = createVelvetBlackMaterial({
    rimStrength: 0.84, rimStart: 0.64, rimEnd: 0.88,
    baseHex: 0x0a0a0e, litHex: 0x18181f, rimHex: 0xe2e8f0,
    fadeUpperRim: true
  });

  const eyelidMat = createVelvetBlackMaterial({
    rimStrength: 0.08, rimStart: 0.72, rimEnd: 0.95,
    baseHex: 0x0a0a0d, litHex: 0x16161c, rimHex: 0x64748b
  });

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

  const catRoot = new THREE.Group();
  catRoot.position.set(0.18, 0.02, -0.35);
  scene.add(catRoot);

  // Pear / Onigiri Torso
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
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, -0.52, -0.05);
  catRoot.add(torsoPivot);

  const torsoMesh = new THREE.Mesh(torsoGeo, bodyFurMat);
  torsoMesh.position.set(0, 0.52, 0.05);
  torsoPivot.add(torsoMesh);

  // Tucked hind thighs & feet
  function createHindLeg(side) {
    const grp = new THREE.Group();
    const s = side === 'left' ? -1 : 1;
    const thighGeo = new THREE.SphereGeometry(0.24, 28, 20);
    thighGeo.scale(0.92, 1.04, 1.06);
    const thigh = new THREE.Mesh(thighGeo, bodyFurMat);
    thigh.position.set(s * 0.56, -0.62, 0.34);
    grp.add(thigh);

    const footGeo = new THREE.SphereGeometry(0.175, 28, 22);
    footGeo.scale(1.06, 0.70, 1.15);
    const foot = new THREE.Mesh(footGeo, limbFurMat);
    foot.position.set(s * 0.56, -0.77, 0.54);
    grp.add(foot);
    return grp;
  }
  const hindLegsGroup = new THREE.Group();
  hindLegsGroup.add(createHindLeg('left'));
  hindLegsGroup.add(createHindLeg('right'));
  catRoot.add(hindLegsGroup);

  // Tail (joint-origin tailPivot prevents tailTip detachment on high raises)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0.55, -0.06, -0.09);
  torsoPivot.add(tailPivot);

  const tailOrigin = new THREE.Vector3(0.55, -0.58, -0.14);
  const tailBasePts = [
    new THREE.Vector3(0.55, -0.58, -0.14),
    new THREE.Vector3(1.04, -0.54, -0.08),
    new THREE.Vector3(1.24, -0.18,  0.04),
    new THREE.Vector3(1.60, -0.06,  0.14)
  ];
  const tailLocalPts = tailBasePts.map((pt) => pt.clone().sub(tailOrigin));
  const tailCurve = new THREE.CatmullRomCurve3(tailLocalPts);
  const tailGeo = new THREE.TubeGeometry(tailCurve, 28, 0.125, 16, false);
  const tailMesh = new THREE.Mesh(tailGeo, bodyFurMat);
  tailPivot.add(tailMesh);

  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.126, 20, 16), bodyFurMat);
  tailTip.position.copy(tailLocalPts[3]);
  tailPivot.add(tailTip);

  // Head pivot (child of torsoPivot so leaning torso carries neck & head naturally)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.06, 0.07);
  torsoPivot.add(headPivot);

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
    if (y < -0.28) y = -0.28 + (y + 0.28) * 0.80;
    headPosAttr.setXYZ(i, x, y, z);
    headBasePositions[i * 3] = x;
    headBasePositions[i * 3 + 1] = y;
    headBasePositions[i * 3 + 2] = z;
  }
  headGeo.computeVertexNormals();
  const headMesh = new THREE.Mesh(headGeo, bodyFurMat);
  headCenterGroup.add(headMesh);

  // Short rounded kitten ears
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

  // 3D Eyes + pupils (with dynamic dilation support!) + 3D Eyelids
  function create3DEye(side) {
    const s = side === 'left' ? -1 : 1;
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(s * 0.195, 0.01, 0.535);
    eyeSocket.rotation.y = s * 0.14;
    eyeSocket.rotation.z = s * -0.04;

    const eyeFlatContainer = new THREE.Group();
    eyeFlatContainer.scale.set(0.88, 1.02, 0.34);
    eyeSocket.add(eyeFlatContainer);

    const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.175, 32, 24), irisMat);
    eyeFlatContainer.add(eyeball);

    const pupilPivot = new THREE.Group();
    eyeFlatContainer.add(pupilPivot);

    const pupilGeo = new THREE.SphereGeometry(0.078, 24, 18);
    pupilGeo.scale(0.76, 1.15, 0.24);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.165);
    pupilPivot.add(pupil);

    const lidGeo = new THREE.SphereGeometry(0.186, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const upperLidPivot = new THREE.Group();
    upperLidPivot.rotation.x = -1.52;
    upperLidPivot.add(new THREE.Mesh(lidGeo, eyelidMat));
    eyeFlatContainer.add(upperLidPivot);

    const lowerLidGeo = new THREE.SphereGeometry(0.184, 32, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52);
    const lowerLidPivot = new THREE.Group();
    lowerLidPivot.rotation.x = 1.52;
    lowerLidPivot.add(new THREE.Mesh(lowerLidGeo, eyelidMat));
    eyeFlatContainer.add(lowerLidPivot);

    return { eyeSocket, pupilPivot, pupil, upperLidPivot, lowerLidPivot };
  }

  const leftEye3D = create3DEye('left');
  const rightEye3D = create3DEye('right');
  headCenterGroup.add(leftEye3D.eyeSocket);
  headCenterGroup.add(rightEye3D.eyeSocket);

  // Cute silver-white closed sleeping eye crescents (visible only during nap / exhausted!)
  const sleepEyesGroup = new THREE.Group();
  sleepEyesGroup.visible = false;
  const sleepArcMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const sleepArcGeo = new THREE.TorusGeometry(0.10, 0.015, 8, 20, Math.PI);
  for (const s of [-1, 1]) {
    const arc = new THREE.Mesh(sleepArcGeo, sleepArcMat);
    arc.position.set(s * 0.195, 0.03, 0.615);
    arc.rotation.y = s * 0.14;
    arc.rotation.z = Math.PI + s * -0.06;
    sleepEyesGroup.add(arc);
  }
  headCenterGroup.add(sleepEyesGroup);

  // Tiny cute 3D Pink Cat Tongue (hidden at rest, peeks during Churu lick, groom, or yawn!)
  const tonguePivot = new THREE.Group();
  tonguePivot.position.set(0, -0.19, 0.52);
  tonguePivot.visible = false;
  const tongueGeo = new THREE.SphereGeometry(0.068, 18, 14);
  tongueGeo.scale(0.85, 0.36, 1.45);
  const tongueMesh = new THREE.Mesh(
    tongueGeo,
    new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.45 })
  );
  tongueMesh.position.set(0, 0, 0.055);
  tonguePivot.add(tongueMesh);
  headCenterGroup.add(tonguePivot);

  // Rosy cheek blush
  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xfb7185, transparent: true, opacity: 0, depthWrite: false
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

  // Whiskers
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
      grp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.0068, 6, false), whiskerMat));
    }
    return grp;
  }
  headCenterGroup.add(createWhiskers('left'));
  headCenterGroup.add(createWhiskers('right'));

  // Unlockable Accessories (Bell, Bowtie, Headphones, Beret)
  const accessoryGroups = {};

  // 1. Gold Bell Collar (neck)
  const bellGrp = new THREE.Group();
  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.50, 0.045, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 })
  );
  collarRing.rotation.x = Math.PI / 2 - 0.12;
  collarRing.position.set(0, 0.52, 0.06);
  const bellSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.25 })
  );
  bellSphere.position.set(0, 0.42, 0.56);
  bellGrp.position.set(0, 0.52, 0.05);
  bellGrp.add(collarRing, bellSphere);
  bellGrp.visible = false;
  torsoPivot.add(bellGrp);
  accessoryGroups.bell = bellGrp;

  // 2. Pastel Bowtie
  const bowGrp = new THREE.Group();
  bowGrp.position.set(0, 1.00, 0.61);
  const bowMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.45 });
  const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.20, 12), bowMat);
  bowL.rotation.z = -Math.PI / 2;
  bowL.position.x = -0.10;
  const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.20, 12), bowMat);
  bowR.rotation.z = Math.PI / 2;
  bowR.position.x = 0.10;
  const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 12), bowMat);
  bowGrp.add(bowL, bowR, bowCenter);
  bowGrp.visible = false;
  torsoPivot.add(bowGrp);
  accessoryGroups.bowtie = bowGrp;

  // 3. Cute Gaming Headphones (on headCenterGroup so they tilt with head!)
  const hpGrp = new THREE.Group();
  const hpBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.045, 12, 32, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
  );
  hpBand.position.set(0, 0.05, 0.0);
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const cupGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.11, 20);
  cupGeo.rotateZ(Math.PI / 2);
  const cupL = new THREE.Mesh(cupGeo, cupMat);
  cupL.position.set(-0.65, 0.02, 0.02);
  const cupR = new THREE.Mesh(cupGeo, cupMat);
  cupR.position.set(0.65, 0.02, 0.02);
  hpGrp.add(hpBand, cupL, cupR);
  hpGrp.visible = false;
  headCenterGroup.add(hpGrp);
  accessoryGroups.headphones = hpGrp;

  // 4. Artist Beret
  const beretGrp = new THREE.Group();
  beretGrp.position.set(0.10, 0.56, 0.02);
  beretGrp.rotation.z = -0.18;
  const beretCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.65 })
  );
  beretCap.scale.set(1.1, 0.36, 1.05);
  const beretStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.6 })
  );
  beretStem.position.y = 0.16;
  beretGrp.add(beretCap, beretStem);
  beretGrp.visible = false;
  headCenterGroup.add(beretGrp);
  accessoryGroups.beret = beretGrp;

  function setAccessory(name) {
    Object.entries(accessoryGroups).forEach(([k, g]) => {
      g.visible = k === name;
    });
  }

  // Dynamic 3D IK Chubby Arms
  function createDynamicArm(side) {
    const s = side === 'left' ? -1 : 1;
    const armGroup = new THREE.Group();
    catRoot.add(armGroup);

    const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 18), bodyFurMat);
    shoulderMesh.position.set(s * 0.48, 0.14, 0.36);
    armGroup.add(shoulderMesh);

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

    const pawGeo = new THREE.SphereGeometry(0.168, 28, 22);
    pawGeo.scale(1.06, 0.80, 1.12);
    const pawMesh = new THREE.Mesh(pawGeo, limbFurMat);
    armGroup.add(pawMesh);

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
      pawMesh.rotation.y = Math.atan2(pawPos.x - elbowPos.x, pawPos.z - elbowPos.z);

      p0.copy(shPos);
      p1.copy(elbowPos);
      p2.copy(pawPos);

      for (let i = 0; i <= segsLen; i++) {
        const t = i / segsLen;
        const omt = 1 - t;
        center.set(
          omt * omt * p0.x + 2 * omt * t * p1.x + t * t * p2.x,
          omt * omt * p0.y + 2 * omt * t * p1.y + t * t * p2.y,
          omt * omt * p0.z + 2 * omt * t * p1.z + t * t * p2.z
        );
        tangent.set(
          2 * omt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
          2 * omt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
          2 * omt * (p1.z - p0.z) + 2 * t * (p2.z - p1.z)
        ).normalize();

        normalVec.crossVectors(upRef, tangent);
        if (normalVec.lengthSq() < 0.001) normalVec.set(1, 0, 0);
        else normalVec.normalize();
        binormal.crossVectors(tangent, normalVec).normalize();

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
          normals[idx]       = nx;
          normals[idx + 1]   = ny;
          normals[idx + 2]   = nz;
        }
      }
      armGeo.attributes.position.needsUpdate = true;
      armGeo.attributes.normal.needsUpdate = true;
    }

    return { armGroup, updateArm, pawMesh };
  }

  const rightArm3D = createDynamicArm('left');
  const leftArm3D  = createDynamicArm('right');

  let curDilate = 1.0;
  function setEyeDilate(targetScale) {
    curDilate += (targetScale - curDilate) * 0.2;
    leftEye3D.pupil.scale.set(curDilate, curDilate * 0.96, 1.0);
    rightEye3D.pupil.scale.set(curDilate, curDilate * 0.96, 1.0);
  }

  function applyCoatAndEyes(coatName, eyeName) {
    const coat = CAT_COATS[coatName] || CAT_COATS.black;
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

    const eye = EYE_COLORS[eyeName] || EYE_COLORS.lime;
    irisMat.uniforms.uDarkLime.value.setHex(eye.dark);
    irisMat.uniforms.uBrightLime.value.setHex(eye.bright);
  }

  return {
    catRoot,
    torsoPivot,
    torsoMesh,
    hindLegsGroup,
    tailPivot,
    tailMesh,
    tailTip,
    tailBasePts,
    headPivot,
    headCenterGroup,
    headGeo,
    headBasePositions,
    leftEar,
    rightEar,
    leftEye3D,
    rightEye3D,
    sleepEyesGroup,
    tonguePivot,
    blushMat,
    rightArm3D,
    leftArm3D,
    setAccessory,
    setEyeDilate,
    applyCoatAndEyes
  };
}
