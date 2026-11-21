import * as THREE from 'three';

export const KB_THEMES = {
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

export const MOUSE_COLORS = {
  white: { body: 0xffffff, wheel: 0x475569, highlight: 0x84cc16 },
  pink:  { body: 0xfbcfe8, wheel: 0xdb2777, highlight: 0xec4899 },
  mint:  { body: 0xa7f3d0, wheel: 0x059669, highlight: 0x10b981 },
  black: { body: 0x27272a, wheel: 0xa3e635, highlight: 0x84cc16 }
};

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

export function createProps(scene) {
  const deskGroup = new THREE.Group();
  scene.add(deskGroup);

  // 1. 3D Pebble Mouse
  const mouseBasePos = new THREE.Vector3(-1.06, -0.84, 0.70);
  const mouseGroup = new THREE.Group();
  mouseGroup.position.copy(mouseBasePos);
  mouseGroup.rotation.set(0.24, 0.08, -0.04);
  deskGroup.add(mouseGroup);

  const pebbleBodyGeo = new THREE.SphereGeometry(0.24, 32, 24);
  pebbleBodyGeo.scale(1.0, 0.56, 1.08);
  const pebbleBodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.40, metalness: 0.02 });
  mouseGroup.add(new THREE.Mesh(pebbleBodyGeo, pebbleBodyMat));

  const mouseShadowGeo = new THREE.CircleGeometry(0.26, 32);
  mouseShadowGeo.rotateX(-Math.PI / 2);
  const mouseShadow = new THREE.Mesh(
    mouseShadowGeo,
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.32 })
  );
  mouseShadow.position.y = -0.115;
  mouseGroup.add(mouseShadow);

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

  const scrollWheel = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.044, 0.095),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
  );
  scrollWheel.position.set(0, 0.125, 0.065);
  mouseGroup.add(scrollWheel);

  // 2. Compact 3D Mechanical Keyboard
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(0.24, -0.96, 0.82);
  keyboardGroup.rotation.set(0.30, 0.0, -0.045);
  deskGroup.add(keyboardGroup);

  const kbW = 2.02;
  const kbD = 0.80;
  const kbChassisMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 });
  const kbChassis = new THREE.Mesh(new THREE.BoxGeometry(kbW, 0.12, kbD), kbChassisMat);
  kbChassis.position.y = -0.04;
  keyboardGroup.add(kbChassis);

  const keyMap3D = new Map();
  const allKeys3D = [];

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

    g.fillStyle = isActive ? th.actBg : (isOrange ? th.accBg : th.keyBg);
    g.fillRect(0, 0, cw, ch);
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
      map: tex, roughness: 0.38,
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

        const baseMats = [sideMat, sideMat, topBase, sideMat, sideMat, sideMat];
        const activeMats = [activeKeyMat, activeKeyMat, topActive, activeKeyMat, activeKeyMat, activeKeyMat];
        const mesh = new THREE.Mesh(geo, baseMats);
        mesh.position.set(x, 0.036, z);
        keyboardGroup.add(mesh);

        const entry = {
          ...k, wLen: w, dLen: d, isOrange, mesh, baseMats, activeMats,
          localPos: new THREE.Vector3(x, 0.072, z),
          hand: x < 0.05 ? 'left' : 'right',
          row: r
        };
        keyMap3D.set(k.id, entry);
        allKeys3D.push(entry);
      }
    }
  }
  build3DKeyboard();

  function applyKeyboardTheme(themeName) {
    const th = KB_THEMES[themeName] || KB_THEMES.classic;
    kbChassisMat.color.setHex(th.chassis);
    whiteKeyMat.color.setHex(th.keySide);
    orangeKeyMat.color.setHex(th.accSide);
    activeKeyMat.color.setHex(th.actSide);
    activeKeyMat.emissive.setHex(th.actSide);

    for (const k of allKeys3D) {
      k.baseMats[2] = getKbKeyTopMaterial(k.label, k.isOrange, false, k.wLen, k.dLen, themeName);
      k.activeMats[2] = getKbKeyTopMaterial(k.label, k.isOrange, true, k.wLen, k.dLen, themeName);
    }
  }

  function applyMouseColor(name) {
    const mc = MOUSE_COLORS[name] || MOUSE_COLORS.white;
    pebbleBodyMat.color.setHex(mc.body);
    scrollWheel.material.color.setHex(mc.wheel);
    mouseLeftHighlight.material.color.setHex(mc.highlight);
    mouseRightHighlight.material.color.setHex(mc.highlight);
  }

  // 3. Key Impacts & Floating Keycaps
  const keyImpacts = [];
  const impactRingGeo = new THREE.RingGeometry(0.14, 0.23, 18);
  impactRingGeo.rotateX(-Math.PI / 2);
  const impactCrossGeo = new THREE.PlaneGeometry(0.42, 0.06);
  impactCrossGeo.rotateX(-Math.PI / 2);

  function spawnKeyImpact(localPos, themeName = 'classic') {
    const th = KB_THEMES[themeName] || KB_THEMES.classic;
    const grp = new THREE.Group();
    grp.position.set(localPos.x, 0.095, localPos.z);

    const ringMat = new THREE.MeshBasicMaterial({ color: th.impact, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    grp.add(new THREE.Mesh(impactRingGeo, ringMat));
    const rayMat = new THREE.MeshBasicMaterial({ color: th.impact, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const ray1 = new THREE.Mesh(impactCrossGeo, rayMat);
    ray1.rotation.y = Math.PI / 4;
    const ray2 = new THREE.Mesh(impactCrossGeo, rayMat);
    ray2.rotation.y = -Math.PI / 4;
    grp.add(ray1, ray2);

    keyboardGroup.add(grp);
    keyImpacts.push({ grp, mats: [ringMat, rayMat], age: 0, maxAge: 13 });
  }

  const floatingCapsGroup = new THREE.Group();
  scene.add(floatingCapsGroup);
  const floatingCaps = [];
  const keycapTextureCache = new Map();
  const capSideMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });

  function getKeycapTexture(label, isCaps, isSpace) {
    const key = `${label}_${isCaps}_${isSpace}`;
    if (keycapTextureCache.has(key)) return keycapTextureCache.get(key);
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#cbd5e1';
    g.lineWidth = 8;
    g.strokeRect(4, 4, 120, 120);
    if (isCaps) {
      g.beginPath(); g.arc(24, 24, 9, 0, Math.PI * 2); g.fillStyle = '#84cc16'; g.fill();
      g.fillStyle = '#0f172a'; g.font = 'bold 54px "Segoe UI", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⇪', 64, 68);
    } else if (!isSpace) {
      g.fillStyle = '#0f172a';
      g.font = label.length > 2 ? 'bold 34px "Segoe UI", sans-serif' : 'bold 62px "Segoe UI", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 64, 66);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    keycapTextureCache.set(key, tex);
    return tex;
  }

  function spawnFloatingKeycap(keyInfo) {
    const label = keyInfo.label || '?';
    const isWide = keyInfo.isSpace || label === '␣' || label.length > 2;
    const isCaps = keyInfo.isCaps || label === '⇪';
    const w = isWide ? 0.30 : 0.21;
    const h = 0.19;
    const d = 0.09;
    const topMat = new THREE.MeshBasicMaterial({ map: getKeycapTexture(keyInfo.isSpace ? '' : label, isCaps, Boolean(keyInfo.isSpace)), transparent: true });
    const sideMatInst = capSideMat.clone();
    sideMatInst.transparent = true;
    const mats = [sideMatInst, sideMatInst, sideMatInst, sideMatInst, topMat, sideMatInst];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    mesh.position.set(0.20 + (Math.random() - 0.35) * 0.72, -0.55 + (Math.random() - 0.5) * 0.06, 1.14 + Math.random() * 0.08);
    floatingCapsGroup.add(mesh);
    floatingCaps.push({
      mesh, mats, w, age: 0, maxAge: 42,
      vx: (Math.random() - 0.3) * 0.014, vy: 0.018 + Math.random() * 0.008,
      vrotZ: (Math.random() - 0.5) * 0.015, vrotY: (Math.random() - 0.5) * 0.010
    });
    if (floatingCaps.length > 7) {
      const old = floatingCaps.shift();
      floatingCapsGroup.remove(old.mesh);
      old.mesh.geometry.dispose();
    }
  }

  // 4. Spawn-on-Trigger Interactive Props (ONLY visible while triggered!)
  const tempPropsGroup = new THREE.Group();
  scene.add(tempPropsGroup);

  // 4A. Ceramic Kibble Bowl
  const foodBowlGroup = new THREE.Group();
  foodBowlGroup.position.set(1.52, -0.78, 0.58);
  foodBowlGroup.visible = false;
  const bowlOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.24, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.35 })
  );
  const kibbleMound = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
  );
  kibbleMound.position.y = 0.06;
  kibbleMound.scale.y = 0.45;
  foodBowlGroup.add(bowlOuter, kibbleMound);
  tempPropsGroup.add(foodBowlGroup);

  // 4B. Deluxe Tuna Can
  const tunaCanGroup = new THREE.Group();
  tunaCanGroup.position.set(1.52, -0.78, 0.58);
  tunaCanGroup.visible = false;
  const canBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: 0xfb7185, metalness: 0.35, roughness: 0.3 })
  );
  const canMeat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.04, 20),
    new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.7 })
  );
  canMeat.position.y = 0.10;
  const canRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.025, 10, 24),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.2 })
  );
  canRim.rotation.x = Math.PI / 2;
  canRim.position.y = 0.11;
  tunaCanGroup.add(canBody, canMeat, canRim);
  tempPropsGroup.add(tunaCanGroup);

  // 4C. Churu Treat Stick (follows cursor in feedChuru mode!)
  const churuGroup = new THREE.Group();
  churuGroup.visible = false;
  const churuTube = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.52, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.4 })
  );
  churuTube.position.set(0.08, -0.22, 0);
  churuTube.rotation.z = 0.45;
  const churuPuree = new THREE.Mesh(
    new THREE.SphereGeometry(0.068, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 })
  );
  churuPuree.scale.set(0.9, 1.3, 0.9);
  churuGroup.add(churuTube, churuPuree);
  tempPropsGroup.add(churuGroup);

  // 4D. Feather Wand (follows cursor in playWand mode!)
  const wandGroup = new THREE.Group();
  wandGroup.visible = false;
  const wandStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.024, 1.0, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
  );
  wandStick.position.set(0.32, 0.38, 0);
  wandStick.rotation.z = 0.68;
  const wandBell = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.65, roughness: 0.25 })
  );
  const feather1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.32, 10),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 })
  );
  feather1.position.set(-0.04, -0.16, 0.02);
  feather1.rotation.z = Math.PI + 0.18;
  const feather2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 })
  );
  feather2.position.set(0.05, -0.15, -0.02);
  feather2.rotation.z = Math.PI - 0.18;
  wandGroup.add(wandStick, wandBell, feather1, feather2);
  tempPropsGroup.add(wandGroup);

  // 4E. Yarn Ball (physics-driven while playYarn active!)
  const yarnGroup = new THREE.Group();
  yarnGroup.visible = false;
  const yarnBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.75 })
  );
  const yarnStripe1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.022, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.7 })
  );
  const yarnStripe2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.022, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.7 })
  );
  yarnStripe2.rotation.y = Math.PI / 2;
  yarnGroup.add(yarnBall, yarnStripe1, yarnStripe2);
  tempPropsGroup.add(yarnGroup);

  // 4F. Cute Glowing Bug / Moth (bugHunt)
  const bugGroup = new THREE.Group();
  bugGroup.visible = false;
  const bugBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  const wingGeo = new THREE.CircleGeometry(0.11, 14);
  const wingMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const bugWingL = new THREE.Mesh(wingGeo, wingMat);
  bugWingL.position.set(-0.08, 0.04, 0);
  const bugWingR = new THREE.Mesh(wingGeo, wingMat);
  bugWingR.position.set(0.08, 0.04, 0);
  bugGroup.add(bugBody, bugWingL, bugWingR);
  tempPropsGroup.add(bugGroup);

  // 4G. Mini Cardboard Peek Box (boxPeek)
  const boxGroup = new THREE.Group();
  boxGroup.position.set(0.20, -0.58, 0.25);
  boxGroup.visible = false;
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
  const boxFront = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.76, 0.06), boxMat);
  boxFront.position.set(0, 0, 0.56);
  const boxSideL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 1.15), boxMat);
  boxSideL.position.set(-0.83, 0, 0);
  const boxSideR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 1.15), boxMat);
  boxSideR.position.set(0.83, 0, 0);
  const boxFlapL = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.28, 0.05), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }));
  boxFlapL.position.set(-0.55, 0.44, 0.56);
  boxFlapL.rotation.x = 0.45;
  boxGroup.add(boxFront, boxSideL, boxSideR, boxFlapL);
  tempPropsGroup.add(boxGroup);

  // 5. Tiny Floating Sprite Effects (+1 Coins, Hearts, Zzz)
  const fxList = [];
  const fxTexCache = new Map();
  function getFxSpriteMat(text, color) {
    const key = `${text}_${color}`;
    if (fxTexCache.has(key)) return fxTexCache.get(key).clone();
    const c = document.createElement('canvas');
    c.width = 96; c.height = 64;
    const g = c.getContext('2d');
    g.font = 'bold 34px "Segoe UI", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    g.lineWidth = 5;
    g.strokeText(text, 48, 32);
    g.fillStyle = color;
    g.fillText(text, 48, 32);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    fxTexCache.set(key, mat);
    return mat.clone();
  }

  function spawnFxText(text, color, worldPos, vy = 0.022, maxAge = 36) {
    const mat = getFxSpriteMat(text, color);
    const sp = new THREE.Sprite(mat);
    sp.position.copy(worldPos);
    sp.scale.set(0.46, 0.30, 1);
    tempPropsGroup.add(sp);
    fxList.push({ sp, mat, vx: (Math.random() - 0.5) * 0.008, vy, age: 0, maxAge });
    if (fxList.length > 18) {
      const old = fxList.shift();
      tempPropsGroup.remove(old.sp);
      old.mat.dispose();
    }
  }

  function updateEffects(now, activeKeys, themeName, kbRecoil) {
    keyboardGroup.position.y = -0.96 + kbRecoil.y;
    keyboardGroup.rotation.set(0.30 + kbRecoil.tiltX, 0.0, -0.045 + kbRecoil.tiltZ);

    for (const [kId, exp] of activeKeys.entries()) {
      if (now > exp) activeKeys.delete(kId);
    }
    for (const k of allKeys3D) {
      const isPressed = activeKeys.has(k.id);
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

    for (let i = fxList.length - 1; i >= 0; i--) {
      const f = fxList[i];
      f.age++;
      f.sp.position.x += f.vx;
      f.sp.position.y += f.vy;
      f.vy *= 0.97;
      f.mat.opacity = f.age > f.maxAge * 0.5 ? Math.max(0, 1 - (f.age - f.maxAge * 0.5) / (f.maxAge * 0.5)) : 1;
      if (f.age >= f.maxAge) {
        tempPropsGroup.remove(f.sp);
        f.mat.dispose();
        fxList.splice(i, 1);
      }
    }
  }

  return {
    deskGroup,
    mouseGroup,
    mouseBasePos,
    mouseLeftHighlight,
    mouseRightHighlight,
    keyboardGroup,
    keyMap3D,
    allKeys3D,
    applyKeyboardTheme,
    applyMouseColor,
    spawnKeyImpact,
    spawnFloatingKeycap,
    tempPropsGroup,
    foodBowlGroup,
    tunaCanGroup,
    churuGroup,
    wandGroup,
    yarnGroup,
    bugGroup,
    bugWingL,
    bugWingR,
    boxGroup,
    spawnFxText,
    updateEffects
  };
}
