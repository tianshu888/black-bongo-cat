import * as THREE from 'three';
import { createCatRig } from './catRig.js';
import { createProps } from './props.js';
import { createBehaviorSystem } from './behaviors.js';

/**
 * Black Bongo Cat 3D Desktop Pet (v2.0)
 * - Widened click-through transparent stage (500x390 base, same visual cat size!)
 * - Spawn-on-trigger 3D food bowls, Churu stick, feather wand, yarn ball, flying bugs & box
 * - Work-to-earn Coins + Affection/Hunger/Mood/Energy + Cozy Left-Click Petting
 */

const canvas = document.getElementById('pet-canvas');
let W = 500;
let H = 390;

const userSettings = {
  scale: 1.0,
  keyboardTheme: 'classic',
  mouseColor: 'white',
  catCoat: 'black',
  eyeColor: 'lime',
  equippedAccessory: 'none',
  showFloatingKeys: true,
  showFloatingCoins: true,
  showImpactGlow: true,
  focusNoDisturb: false,
  soundEnabled: true,
  alwaysOnTop: true,
  lockPosition: false
};

const gameState = {
  coins: 80,
  hunger: 84,
  mood: 86,
  energy: 92,
  affection: 0,
  inventory: { kibble: 1, churu: 1, can: 0, yarn: 0, wand: 0 },
  unlockedAccessories: ['none'],
  stats: { totalKeys: 0, totalClicks: 0, totalPets: 0, bugsCaught: 0, feedCount: 0 }
};

const HAND_OPEN_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M15 4c1 0 1.8.8 1.8 1.8v6.5h.8V5.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v6.8h.8V7.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v9.5c0 4.5-3.2 8.2-7.5 8.8v2.5h-7v-2.5c-3.2-.8-5.7-3.2-6.6-6.4l-1.5-5.2c-.3-1 .3-2.1 1.3-2.4.9-.3 1.9.2 2.3 1.1l1.2 3V6.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v5.8h.8V5.8C13.2 4.8 14 4 15 4z' fill='white' stroke='%2318181b' stroke-width='1.8' stroke-linejoin='round'/><rect x='11.5' y='25' width='8' height='4' rx='1.5' fill='%2327272a' stroke='%2318181b' stroke-width='1.5'/></svg>") 16 14, grab`;

// ============================================================================
// 1. THREE.JS RENDERER, CAMERA & STUDIO LIGHTS
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
camera.position.set(-0.08, 2.02, 10.65);
camera.lookAt(-0.08, 0.08, 0);

scene.add(new THREE.AmbientLight(0xffffff, 1.15));
const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
keyLight.position.set(-2.2, 5.8, 5.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
fillLight.position.set(3.5, 2.5, 3.2);
scene.add(fillLight);

// ============================================================================
// 2. RIG, PROPS & BEHAVIOR STATE MACHINE
// ============================================================================
const rig = createCatRig(scene);
const props = createProps(scene);

const state = {
  normX: 0.5, normY: 0.5,
  relX: 0, relY: 0,
  winX: W / 2, winY: H / 2,
  hasInitialMouse: false,

  rigSpring: {
    yaw: 0, vYaw: 0, targetYaw: 0,
    pitch: 0, vPitch: 0, targetPitch: 0,
    roll: 0, vRoll: 0, targetRoll: 0,
    bodyX: 0, vBodyX: 0, targetBodyX: 0,
    bodyY: 0, vBodyY: 0, targetBodyY: 0
  },
  jelly: { x: 0, vx: 0, targetX: 0, y: 0, vy: 0, targetY: 0 },

  gazeX: 0, gazeY: 0,
  targetGazeX: 0, targetGazeY: 0,
  typingLookTimer: 0,
  typingFocusX: 0, typingFocusY: -0.78,
  squintAmount: 0,
  blinkTimer: 160,
  blinkAmount: 0,

  mouseOffset: new THREE.Vector2(0, 0),
  mouseTargetOffset: new THREE.Vector2(0, 0),
  mouseLeftDown: false,
  mouseRightDown: false,
  mouseActiveTimer: 0,

  isOverCat: false,
  isOverProp: false,
  isOverToyProp: false,
  isPetting: false,
  isDraggingWindow: false,
  globalAltDown: false,
  dragLastScreen: { x: 0, y: 0 },
  petIntensity: 0,

  activeKeys: new Map(),
  rightPaw: {
    pos: new THREE.Vector3(-0.34, -0.36, 0.78),
    target: new THREE.Vector3(-0.34, -0.36, 0.78),
    rest: new THREE.Vector3(-0.34, -0.36, 0.78),
    mode: 'rest', timer: 0, strikeAge: 99, hitPop: 0
  },
  leftPaw: {
    pos: new THREE.Vector3(0.24, -0.66, 0.76),
    target: new THREE.Vector3(0.24, -0.66, 0.76),
    rest: new THREE.Vector3(0.24, -0.66, 0.76),
    isTyping: false, timer: 0, strikeAge: 99, hitPop: 0
  },
  lastSpaceHand: 'left',
  kbRecoil: { y: 0, vy: 0, tiltX: 0, vTiltX: 0, tiltZ: 0, vTiltZ: 0 },
  tailPhase: 0,
  breathPhase: 0
};

const behaviors = createBehaviorSystem({
  rig,
  props,
  state,
  userSettings,
  gameState,
  onPersistGame: (gs) => {
    if (window.bongoAPI && window.bongoAPI.updateGameState) {
      window.bongoAPI.updateGameState(gs);
    }
  }
});

// ============================================================================
// 3. TYPING & RAYCAST HIT-TESTING
// ============================================================================
const tempWorldVec = new THREE.Vector3();
const tempKeyPosWorld = new THREE.Vector3();

function triggerKeyPress(data) {
  const k = props.keyMap3D.get(data.id) ||
    props.allKeys3D.find((item) => item.label === data.label) ||
    props.allKeys3D[Math.floor(Math.random() * props.allKeys3D.length)];

  props.keyboardGroup.updateMatrixWorld(true);
  rig.catRoot.updateMatrixWorld(true);
  tempKeyPosWorld.copy(k.localPos).applyMatrix4(props.keyboardGroup.matrixWorld);

  if (!behaviors.canWork()) {
    if (!data.isRepeat) {
      behaviors.onWorkKey(tempKeyPosWorld);
    }
    return;
  }

  state.activeKeys.set(k.id, performance.now() + 140);

  if (!data.isRepeat) {
    window.catSound.playKeyClick(data.isSpace || k.id === 'Space');
    behaviors.onWorkKey(tempKeyPosWorld);
    if (userSettings.showImpactGlow) {
      props.spawnKeyImpact(k.localPos, userSettings.keyboardTheme);
    }
    if (userSettings.showFloatingKeys) {
      props.spawnFloatingKeycap({
        label: data.label || k.label,
        isSpace: data.isSpace || k.id === 'Space',
        isCaps: data.isCaps || k.id === 'CapsLock'
      });
    }
  } else {
    behaviors.markActiveWork();
  }

  tempWorldVec.copy(tempKeyPosWorld);
  rig.catRoot.worldToLocal(tempWorldVec);
  tempWorldVec.y += 0.08;
  tempWorldVec.z += 0.04;

  let useRightHand = k.hand === 'left';
  if (k.id === 'Space') {
    state.lastSpaceHand = state.lastSpaceHand === 'left' ? 'right' : 'left';
    useRightHand = state.lastSpaceHand === 'left';
  }
  const holdingMouseBtn = state.mouseLeftDown || state.mouseRightDown;
  if (useRightHand && !holdingMouseBtn) state.mouseActiveTimer = 0;

  if (useRightHand && !holdingMouseBtn) {
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

  const keyRelX = Math.max(-1.0, Math.min(1.0, k.localPos.x / 0.92));
  state.typingFocusX = keyRelX * 0.96;
  state.typingFocusY = -0.78 - (k.row / 5) * 0.22;
  state.typingLookTimer = 26;

  state.kbRecoil.vy -= 0.036;
  state.kbRecoil.vTiltX += 0.026;
  state.kbRecoil.vTiltZ -= keyRelX * 0.024;

  state.rigSpring.vPitch += 0.075;
  state.rigSpring.vYaw += keyRelX * 0.11;
  state.rigSpring.vRoll -= keyRelX * 0.038;
  state.rigSpring.vBodyY -= 0.042;
  state.rigSpring.vBodyX += keyRelX * 0.045;
}

const raycaster = new THREE.Raycaster();
const ndcPointer = new THREE.Vector2();
let lastIgnoreMouseState = true;

function updateClickThrough(winX, winY) {
  ndcPointer.set((winX / W) * 2 - 1, -(winY / H) * 2 + 1);
  raycaster.setFromCamera(ndcPointer, camera);

  const catHits = raycaster.intersectObject(rig.catRoot, true);
  const propHits = raycaster.intersectObjects([props.keyboardGroup, props.mouseGroup], true);

  const activeToyMeshes = [];
  if (props.yarnGroup.visible) activeToyMeshes.push(props.yarnGroup);
  if (props.bugGroup.visible) activeToyMeshes.push(props.bugGroup);
  const toyHits = activeToyMeshes.length ? raycaster.intersectObjects(activeToyMeshes, true) : [];

  const overCat = catHits.length > 0;
  const overProp = !overCat && propHits.length > 0;
  const overToy = toyHits.length > 0;

  state.isOverCat = overCat;
  state.isOverProp = overProp;
  state.isOverToyProp = overToy;

  const isCursorToyMode = behaviors.behavior.mode === 'feedChuru' || behaviors.behavior.mode === 'playWand';
  const insideWindow = winX >= 0 && winX <= W && winY >= 0 && winY <= H;

  const shouldCapture =
    (isCursorToyMode && insideWindow) ||
    overCat ||
    overToy ||
    (overProp && state.globalAltDown) ||
    state.isPetting ||
    state.isDraggingWindow;

  if (shouldCapture !== !lastIgnoreMouseState) {
    lastIgnoreMouseState = !shouldCapture;
    if (window.bongoAPI) {
      window.bongoAPI.setIgnoreMouse(lastIgnoreMouseState);
    }
  }

  if (isCursorToyMode && insideWindow) {
    canvas.style.cursor = 'none';
  } else if (state.isDraggingWindow) {
    canvas.style.cursor = 'move';
  } else if (state.isPetting) {
    canvas.style.cursor = HAND_OPEN_CURSOR;
  } else if (overToy) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
}

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (behaviors.behavior.mode === 'feedChuru' || behaviors.behavior.mode === 'playWand') {
    behaviors.exitToWork();
    updateClickThrough(state.winX, state.winY);
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const cx = (typeof e.clientX === 'number' && e.clientX > 0) ? (e.clientX - rect.left) : state.winX;
  const cy = (typeof e.clientY === 'number' && e.clientY > 0) ? (e.clientY - rect.top) : state.winY;
  updateClickThrough(cx, cy);
  if (state.isOverCat && window.bongoAPI) {
    window.bongoAPI.openSettings('shop');
  }
});

// ============================================================================
// 4. INPUT LISTENERS (Left-Click Cozy Petting, Alt+Left-Drag Move, Global Work)
// ============================================================================
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
      state.relX = Math.max(-1, Math.min(1, (data.winX - W / 2) / 220));
      state.relY = Math.max(-1, Math.min(1, (data.winY - H * 0.42) / 220));
    }

    updateClickThrough(data.winX, data.winY);

    if (!state.hasInitialMouse) {
      state.hasInitialMouse = true;
      return;
    }

    const moveDelta = Math.hypot(data.normX - prevNormX, data.normY - prevNormY);
    if (moveDelta > 0.0006 && !state.isPetting && !state.isDraggingWindow && behaviors.canWork()) {
      behaviors.markActiveWork();
      state.mouseActiveTimer = 70;
      const clampedNx = Math.max(0, Math.min(1, data.normX));
      const clampedNy = Math.max(0, Math.min(1, data.normY));
      state.mouseTargetOffset.set((clampedNx - 0.5) * 0.44, -(clampedNy - 0.5) * 0.24);
    }
  });

  window.bongoAPI.onGlobalKeyDown((data) => {
    if (data.id === 'Escape' && (behaviors.behavior.mode === 'feedChuru' || behaviors.behavior.mode === 'playWand')) {
      behaviors.exitToWork();
      return;
    }
    triggerKeyPress(data);
  });
  window.bongoAPI.onGlobalKeyUp((data) => state.activeKeys.delete(data.id));
  if (window.bongoAPI.onAltState) {
    window.bongoAPI.onAltState((down) => {
      state.globalAltDown = Boolean(down);
      updateClickThrough(state.winX, state.winY);
    });
  }
  window.bongoAPI.onGlobalMouseDown((data) => {
    if (state.isPetting || state.isDraggingWindow || (state.isOverCat && data.button === 1)) return;
    if (behaviors.behavior.mode === 'feedChuru' || behaviors.behavior.mode === 'playWand') return;
    const worked = behaviors.onWorkClick();
    if (!worked) return;
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
  if (e.button === 2 && (behaviors.behavior.mode === 'feedChuru' || behaviors.behavior.mode === 'playWand')) {
    behaviors.exitToWork();
    updateClickThrough(state.winX, state.winY);
    return;
  }
  if (e.button !== 0) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  updateClickThrough(x, y);

  if (state.isOverToyProp) {
    behaviors.handleStageClick();
    return;
  }

  const altHeld = e.altKey || state.globalAltDown;
  if (altHeld && (state.isOverCat || state.isOverProp) && !userSettings.lockPosition) {
    state.isDraggingWindow = true;
    state.dragLastScreen = { x: e.screenX, y: e.screenY };
    canvas.style.cursor = 'move';
  } else if (state.isOverCat && !altHeld && !['feedChuru', 'playWand'].includes(behaviors.behavior.mode)) {
    behaviors.exitToWork();
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
    state.winX = x; state.winY = y;
    state.normX = x / W; state.normY = y / H;
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

    state.jelly.vx += dx * 0.0012;
    state.jelly.vy -= dy * 0.0010;
    state.petIntensity = Math.min(35, state.petIntensity + Math.max(0.4, speed * 0.16));
    behaviors.onPetPulse(rig.catRoot.position);

    if (speed > 2.5) window.catSound.playPurrTick(state.petIntensity);
    if (state.petIntensity > 22 && speed > 14) window.catSound.playMeow();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0 || e.buttons === 0) {
    if (state.isPetting) behaviors.onPetEnd();
    state.isPetting = false;
    state.isDraggingWindow = false;
    updateClickThrough(state.winX, state.winY);
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
    const k = props.keyMap3D.get(id);
    if (k) {
      triggerKeyPress({
        id: k.id, label: k.label || '␣', isSpace: k.id === 'Space', isCaps: k.id === 'CapsLock', isRepeat: false
      });
    }
    step++;
    if (step >= 26) clearInterval(timer);
  }, 85);
}

function applySettings(cfg) {
  if (!cfg) return;
  Object.assign(userSettings, cfg);
  props.applyKeyboardTheme(userSettings.keyboardTheme || 'classic');
  props.applyMouseColor(userSettings.mouseColor || 'white');
  rig.applyCoatAndEyes(userSettings.catCoat || 'black', userSettings.eyeColor || 'lime');
  rig.setAccessory(userSettings.equippedAccessory || 'none');
  window.catSound.muted = !userSettings.soundEnabled;
}

function applyGameState(gs) {
  if (!gs) return;
  Object.assign(gameState, gs);
  if (gameState.isExhausted && behaviors.behavior.mode === 'work') {
    behaviors.behavior.mode = 'exhausted';
    behaviors.behavior.timer = 0;
  } else if (!gameState.isExhausted && behaviors.behavior.mode === 'exhausted') {
    behaviors.exitToWork();
  }
}

if (window.bongoAPI) {
  if (window.bongoAPI.getSettings) window.bongoAPI.getSettings().then(applySettings);
  if (window.bongoAPI.getGameState) window.bongoAPI.getGameState().then(applyGameState);
  if (window.bongoAPI.onSettingsChanged) window.bongoAPI.onSettingsChanged(applySettings);
  if (window.bongoAPI.onGameStateChanged) window.bongoAPI.onGameStateChanged(applyGameState);
  if (window.bongoAPI.onPlayAction) window.bongoAPI.onPlayAction((action) => behaviors.handleAction(action));
  if (window.bongoAPI.onTriggerDemo) window.bongoAPI.onTriggerDemo(playDemoTyping);
  if (window.bongoAPI.onTakeCatPhoto) {
    window.bongoAPI.onTakeCatPhoto(({ reqId, pose, theme }) => {
      const dataUrl = captureStudioCatPhoto(pose, theme);
      window.bongoAPI.sendCatPhotoResult(reqId, dataUrl);
    });
  }
  if (window.bongoAPI.onWindowResized) {
    window.bongoAPI.onWindowResized(({ width, height }) => {
      if (!width || !height) return;
      W = width; H = height;
      canvas.width = W; canvas.height = H;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    });
  }
}

// ============================================================================
// 5. MAIN 3D ANIMATION & KINEMATICS LOOP
// ============================================================================
const tempSh = new THREE.Vector3();
const tempEl = new THREE.Vector3();
const tempMouseWorld = new THREE.Vector3();
const strikeGoal = new THREE.Vector3();

function update3DScene() {
  const now = performance.now();
  state.breathPhase += 0.04;
  const isTypingNow = state.typingLookTimer > 0;

  const behOv = behaviors.step(now, ndcPointer, camera);

  // A. Posture & Rig Targets
  let tYaw = 0, tPitch = 0, tRoll = 0, tBodyX = 0;
  let tBodyY = Math.sin(state.breathPhase) * 0.015;
  let desiredDilate = 1.0;

  if (state.isPetting) {
    const sideBias = Math.max(-1, Math.min(1, (state.winX - W / 2) / 140));
    const purrSway = Math.sin(now * 0.0045) * 0.045;
    tYaw = sideBias * 0.14;
    tPitch = -0.07;
    tRoll = sideBias * 0.14 + purrSway;
    tBodyX = 0;
    tBodyY += Math.sin(now * 0.024) * 0.005;
    state.jelly.targetX = sideBias * 0.025;
    state.jelly.targetY = -0.025;
  } else if (behOv) {
    tYaw = behOv.yaw;
    tPitch = behOv.pitch;
    tRoll = behOv.roll;
    tBodyX = behOv.bodyX;
    tBodyY += behOv.bodyY;
    desiredDilate = behOv.dilate || 1.0;
    state.jelly.targetX = 0;
    state.jelly.targetY = 0;
  } else {
    state.jelly.targetX = 0;
    state.jelly.targetY = 0;
    if (state.rightPaw.mode === 'mouse') {
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

  const r = state.rigSpring;
  r.targetYaw = Math.max(-0.85, Math.min(0.85, tYaw));
  r.targetPitch = Math.max(-0.46, Math.min(0.46, tPitch));
  r.targetRoll = Math.max(-0.38, Math.min(0.38, tRoll));
  r.targetBodyX = Math.max(-1.8, Math.min(1.8, tBodyX));
  r.targetBodyY = Math.max(-0.4, Math.min(0.4, tBodyY));

  r.vYaw = (r.vYaw + (r.targetYaw - r.yaw) * 0.18) * 0.74;
  r.yaw += r.vYaw;
  r.vPitch = (r.vPitch + (r.targetPitch - r.pitch) * 0.18) * 0.74;
  r.pitch += r.vPitch;
  r.vRoll = (r.vRoll + (r.targetRoll - r.roll) * 0.16) * 0.74;
  r.roll += r.vRoll;
  r.vBodyX = (r.vBodyX + (r.targetBodyX - r.bodyX) * 0.16) * 0.76;
  r.bodyX += r.vBodyX;
  r.vBodyY = (r.vBodyY + (r.targetBodyY - r.bodyY) * 0.16) * 0.76;
  r.bodyY += r.vBodyY;

  rig.catRoot.position.x = 0.18 + r.bodyX;
  rig.catRoot.position.y = 0.02 + r.bodyY;
  rig.catRoot.rotation.z = -r.bodyX * 0.10;
  rig.headPivot.rotation.set(r.pitch, r.yaw, r.roll);

  // B. Jelly Head Vertex Deformation
  const j = state.jelly;
  j.vx = (j.vx + (j.targetX - j.x) * 0.22) * 0.72;
  j.x += j.vx;
  j.vy = (j.vy + (j.targetY - j.y) * 0.22) * 0.72;
  j.y += j.vy;

  if (Math.abs(j.x) > 0.001 || Math.abs(j.y) > 0.001 || Math.abs(j.vx) > 0.001) {
    const pos = rig.headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = rig.headBasePositions[i * 3];
      const by = rig.headBasePositions[i * 3 + 1];
      const bz = rig.headBasePositions[i * 3 + 2];
      const w = Math.max(0, Math.min(1, (by + 0.55) / 1.1)) * (0.55 + Math.max(0, bz) * 0.65);
      pos.setXYZ(i, bx + j.x * w, by + j.y * w, bz);
    }
    pos.needsUpdate = true;
    rig.headGeo.computeVertexNormals();
    rig.leftEar.position.set(-0.33 + j.x * 0.9, 0.37 + j.y * 0.9, -0.02);
    rig.rightEar.position.set(0.33 + j.x * 0.9, 0.37 + j.y * 0.9, -0.02);
  }

  // C. Eye Gaze, Dilation & Eyelids
  if (behOv) {
    state.targetGazeX = behOv.yaw * 1.1;
    state.targetGazeY = -behOv.pitch * 1.1;
  } else if (state.typingLookTimer > 0) {
    state.typingLookTimer--;
    state.targetGazeX = state.typingFocusX;
    state.targetGazeY = state.typingFocusY;
  } else {
    state.targetGazeX = state.relX;
    state.targetGazeY = -state.relY;
  }

  state.gazeX += (state.targetGazeX - state.gazeX) * 0.44;
  state.gazeY += (state.targetGazeY - state.gazeY) * 0.44;

  const pRotY = Math.max(-0.78, Math.min(0.78, state.gazeX * 0.78));
  const pRotX = Math.max(-0.68, Math.min(0.68, -state.gazeY * 0.68));
  rig.leftEye3D.pupilPivot.rotation.set(pRotX, pRotY, 0);
  rig.rightEye3D.pupilPivot.rotation.set(pRotX, pRotY, 0);
  rig.setEyeDilate(desiredDilate);

  state.petIntensity = Math.max(0, state.petIntensity - 0.18);
  const wantSquint = state.isPetting ? 1.0 : (behOv ? behOv.squint : 0);
  state.squintAmount += (wantSquint - state.squintAmount) * 0.18;

  const wantBlush = state.isPetting ? 0.42 : (behOv ? behOv.blush : 0);
  rig.blushMat.opacity += (wantBlush - rig.blushMat.opacity) * 0.18;
  rig.leftEye3D.eyeSocket.rotation.z = 0.04 - state.squintAmount * 0.09;
  rig.rightEye3D.eyeSocket.rotation.z = -0.04 + state.squintAmount * 0.09;

  state.blinkTimer--;
  if (state.blinkTimer <= 0) {
    state.blinkAmount = 1;
    state.blinkTimer = 170 + Math.floor(Math.random() * 190);
  }
  if (state.blinkAmount > 0) state.blinkAmount = Math.max(0, state.blinkAmount - 0.18);

  const squintUpper = -1.52 + state.squintAmount * 1.38;
  const squintLower = 1.52 - state.squintAmount * 1.36;
  const upperRot = Math.min(0.02, squintUpper + state.blinkAmount * (0.0 - squintUpper));
  const lowerRot = Math.max(-0.02, squintLower - state.blinkAmount * squintLower);
  rig.leftEye3D.upperLidPivot.rotation.x = upperRot;
  rig.rightEye3D.upperLidPivot.rotation.x = upperRot;
  rig.leftEye3D.lowerLidPivot.rotation.x = lowerRot;
  rig.rightEye3D.lowerLidPivot.rotation.x = lowerRot;

  // D. Virtual Mouse & 3D IK Arms
  state.mouseOffset.lerp(state.mouseTargetOffset, 0.28);
  props.mouseGroup.position.set(
    props.mouseBasePos.x + state.mouseOffset.x,
    props.mouseBasePos.y + state.mouseOffset.y * 0.35,
    props.mouseBasePos.z - state.mouseOffset.y * 0.55
  );
  props.mouseLeftHighlight.visible = state.mouseLeftDown;
  props.mouseRightHighlight.visible = state.mouseRightDown;

  if (state.mouseActiveTimer > 0) state.mouseActiveTimer--;

  if (behOv && (behOv.leftPawPos || behOv.rightPawPos)) {
    state.leftPaw.pos.lerp(behOv.leftPawPos || state.leftPaw.rest, 0.38);
    state.rightPaw.pos.lerp(behOv.rightPawPos || state.rightPaw.rest, 0.38);
    rig.leftArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    rig.rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    tempSh.set(-0.40, -0.02, 0.48);
    tempEl.set((tempSh.x + state.rightPaw.pos.x) * 0.5 - 0.10, (tempSh.y + state.rightPaw.pos.y) * 0.5 - 0.04, (tempSh.z + state.rightPaw.pos.z) * 0.5 + 0.14);
    rig.rightArm3D.updateArm(tempSh, tempEl, state.rightPaw.pos);
    tempSh.set(0.38, -0.02, 0.48);
    tempEl.set((tempSh.x + state.leftPaw.pos.x) * 0.5 + 0.08, (tempSh.y + state.leftPaw.pos.y) * 0.5 - 0.04, (tempSh.z + state.leftPaw.pos.z) * 0.5 + 0.14);
    rig.leftArm3D.updateArm(tempSh, tempEl, state.leftPaw.pos);
  } else {
    if (state.leftPaw.timer > 0) {
      state.leftPaw.timer--;
      state.leftPaw.strikeAge++;
      strikeGoal.copy(state.leftPaw.target);
      if (state.leftPaw.strikeAge === 1) {
        strikeGoal.y += 0.22; state.leftPaw.pos.lerp(strikeGoal, 0.82); rig.leftArm3D.pawMesh.scale.set(0.92, 1.15, 0.94);
      } else if (state.leftPaw.strikeAge === 2) {
        strikeGoal.y -= 0.03; state.leftPaw.pos.lerp(strikeGoal, 0.92); rig.leftArm3D.pawMesh.scale.set(1.24, 0.72, 1.18);
      } else {
        state.leftPaw.pos.lerp(strikeGoal, 0.76); rig.leftArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
      }
    } else {
      state.leftPaw.isTyping = false;
      state.leftPaw.target.copy(state.leftPaw.rest);
      state.leftPaw.pos.lerp(state.leftPaw.target, 0.24);
      rig.leftArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    }
    state.leftPaw.hitPop *= 0.72;

    if (state.rightPaw.timer > 0) {
      state.rightPaw.timer--;
      state.rightPaw.strikeAge++;
      state.rightPaw.mode = 'typing';
      strikeGoal.copy(state.rightPaw.target);
      if (state.rightPaw.strikeAge === 1) {
        strikeGoal.y += 0.22; state.rightPaw.pos.lerp(strikeGoal, 0.82); rig.rightArm3D.pawMesh.scale.set(0.92, 1.15, 0.94);
      } else if (state.rightPaw.strikeAge === 2) {
        strikeGoal.y -= 0.03; state.rightPaw.pos.lerp(strikeGoal, 0.92); rig.rightArm3D.pawMesh.scale.set(1.24, 0.72, 1.18);
      } else {
        state.rightPaw.pos.lerp(strikeGoal, 0.76); rig.rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
      }
    } else if (!behOv && (state.mouseActiveTimer > 0 || state.mouseLeftDown || state.mouseRightDown)) {
      state.rightPaw.mode = 'mouse';
      props.mouseGroup.updateMatrixWorld(true);
      rig.catRoot.updateMatrixWorld(true);
      tempMouseWorld.copy(props.mouseGroup.position);
      rig.catRoot.worldToLocal(tempMouseWorld);
      tempMouseWorld.x += 0.02; tempMouseWorld.y += 0.13; tempMouseWorld.z -= 0.07;
      state.rightPaw.target.copy(tempMouseWorld);
      state.rightPaw.pos.lerp(state.rightPaw.target, 0.40);
      rig.rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    } else {
      state.rightPaw.mode = 'rest';
      state.rightPaw.target.copy(state.rightPaw.rest);
      state.rightPaw.pos.lerp(state.rightPaw.target, 0.24);
      rig.rightArm3D.pawMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.35);
    }
    state.rightPaw.hitPop *= 0.72;

    if (state.rightPaw.mode === 'mouse') {
      tempSh.set(-0.50, 0.14, 0.14);
      tempEl.set((tempSh.x + state.rightPaw.pos.x) * 0.5 - 0.03, (tempSh.y + state.rightPaw.pos.y) * 0.5 + 0.01, (tempSh.z + state.rightPaw.pos.z) * 0.5 + 0.04);
    } else {
      const rightTyping = state.rightPaw.mode === 'typing';
      tempSh.set(rightTyping ? -0.36 : -0.40, rightTyping ? -0.14 : -0.02, rightTyping ? 0.44 : 0.48);
      tempEl.set((tempSh.x + state.rightPaw.pos.x) * 0.5 + (rightTyping ? -0.03 : -0.14), (tempSh.y + state.rightPaw.pos.y) * 0.5 + (rightTyping ? 0.03 : -0.08) + state.rightPaw.hitPop * 0.10, (tempSh.z + state.rightPaw.pos.z) * 0.5 + (rightTyping ? 0.10 : 0.18));
    }
    rig.rightArm3D.updateArm(tempSh, tempEl, state.rightPaw.pos);

    const leftReaching = state.leftPaw.isTyping;
    tempSh.set(leftReaching ? 0.34 : 0.38, leftReaching ? -0.14 : -0.02, leftReaching ? 0.44 : 0.48);
    tempEl.set((tempSh.x + state.leftPaw.pos.x) * 0.5 + (leftReaching ? 0.02 : 0.06), (tempSh.y + state.leftPaw.pos.y) * 0.5 + (leftReaching ? 0.03 : -0.04) + state.leftPaw.hitPop * 0.10, (tempSh.z + state.leftPaw.pos.z) * 0.5 + (leftReaching ? 0.10 : 0.18));
    rig.leftArm3D.updateArm(tempSh, tempEl, state.leftPaw.pos);
  }

  // E. Keyboard Recoil, Tail & Temporary Effects
  const kb = state.kbRecoil;
  kb.vy = (kb.vy - kb.y * 0.42) * 0.62; kb.y += kb.vy;
  kb.vTiltX = (kb.vTiltX - kb.tiltX * 0.42) * 0.62; kb.tiltX += kb.vTiltX;
  kb.vTiltZ = (kb.vTiltZ - kb.tiltZ * 0.42) * 0.62; kb.tiltZ += kb.vTiltZ;

  props.updateEffects(now, state.activeKeys, userSettings.keyboardTheme, kb);

  const tailSpeed = behOv ? behOv.tailSpeed : (0.048 + state.petIntensity * 0.012 + (isTypingNow ? 0.03 : 0));
  state.tailPhase += tailSpeed;
  const wag = Math.sin(state.tailPhase) * 0.12;
  const tailHigh = behOv ? (behOv.tailHigh || 0) : 0;
  rig.tailMesh.rotation.z = wag * 0.45 + tailHigh;
  rig.tailTip.position.set(
    rig.tailBasePts[3].x - wag * 0.08 - tailHigh * 0.35,
    rig.tailBasePts[3].y + wag * 0.55 + tailHigh * 0.7,
    rig.tailBasePts[3].z
  );
}

function captureStudioCatPhoto(pose = 'normal', theme = 'blue') {
  const hiddenProps = [
    props.keyboardGroup, props.mouseGroup, props.foodBowlGroup, props.tunaCanGroup,
    props.churuGroup, props.wandGroup, props.yarnGroup, props.bugGroup, props.boxGroup
  ];
  const prevVis = hiddenProps.map((g) => g.visible);
  hiddenProps.forEach((g) => { g.visible = false; });

  const prevCatPos = rig.catRoot.position.clone();
  const prevCatRot = rig.catRoot.rotation.clone();
  const prevHeadRot = rig.headPivot.rotation.clone();
  const prevUpL = rig.leftEye3D.upperLidPivot.rotation.x;
  const prevLoL = rig.leftEye3D.lowerLidPivot.rotation.x;
  const prevUpR = rig.rightEye3D.upperLidPivot.rotation.x;
  const prevLoR = rig.rightEye3D.lowerLidPivot.rotation.x;
  const prevSockL = rig.leftEye3D.eyeSocket.rotation.z;
  const prevSockR = rig.rightEye3D.eyeSocket.rotation.z;
  const prevPupilRotL = rig.leftEye3D.pupilPivot.rotation.clone();
  const prevPupilRotR = rig.rightEye3D.pupilPivot.rotation.clone();
  const prevPupilScale = rig.leftEye3D.pupil.scale.clone();
  const prevBlush = rig.blushMat.opacity;
  const prevTongue = rig.tonguePivot.visible;
  const prevTongueScale = rig.tonguePivot.scale.clone();
  const prevCamPos = camera.position.clone();
  const prevCamQuat = camera.quaternion.clone();
  const prevFov = camera.fov;

  try {
    rig.catRoot.position.set(0, 0, 0);
    rig.catRoot.rotation.set(0, 0, 0);
    rig.leftEye3D.pupilPivot.rotation.set(0, 0, 0);
    rig.rightEye3D.pupilPivot.rotation.set(0, 0, 0);

    if (pose === 'happy') {
      rig.headPivot.rotation.set(-0.04, 0.06, 0.12);
      rig.leftEye3D.upperLidPivot.rotation.x = -0.24;
      rig.rightEye3D.upperLidPivot.rotation.x = -0.24;
      rig.leftEye3D.lowerLidPivot.rotation.x = 0.24;
      rig.rightEye3D.lowerLidPivot.rotation.x = 0.24;
      rig.leftEye3D.eyeSocket.rotation.z = -0.05;
      rig.rightEye3D.eyeSocket.rotation.z = 0.05;
      rig.blushMat.opacity = 0.50;
      rig.tonguePivot.visible = false;
      rig.leftEye3D.pupil.scale.set(1.15, 1.10, 1);
      rig.rightEye3D.pupil.scale.set(1.15, 1.10, 1);
    } else if (pose === 'silly') {
      rig.headPivot.rotation.set(-0.08, -0.06, -0.14);
      rig.leftEye3D.upperLidPivot.rotation.x = -1.52;
      rig.rightEye3D.upperLidPivot.rotation.x = -1.52;
      rig.leftEye3D.lowerLidPivot.rotation.x = 1.52;
      rig.rightEye3D.lowerLidPivot.rotation.x = 1.52;
      rig.leftEye3D.eyeSocket.rotation.z = 0.04;
      rig.rightEye3D.eyeSocket.rotation.z = -0.04;
      rig.blushMat.opacity = 0.45;
      rig.tonguePivot.visible = true;
      rig.tonguePivot.scale.set(1.25, 1.25, 1.35);
      rig.leftEye3D.pupil.scale.set(1.42, 1.36, 1);
      rig.rightEye3D.pupil.scale.set(1.42, 1.36, 1);
    } else {
      rig.headPivot.rotation.set(-0.02, 0, 0);
      rig.leftEye3D.upperLidPivot.rotation.x = -1.52;
      rig.rightEye3D.upperLidPivot.rotation.x = -1.52;
      rig.leftEye3D.lowerLidPivot.rotation.x = 1.52;
      rig.rightEye3D.lowerLidPivot.rotation.x = 1.52;
      rig.leftEye3D.eyeSocket.rotation.z = 0.04;
      rig.rightEye3D.eyeSocket.rotation.z = -0.04;
      rig.blushMat.opacity = 0.16;
      rig.tonguePivot.visible = false;
      rig.leftEye3D.pupil.scale.set(1.12, 1.08, 1);
      rig.rightEye3D.pupil.scale.set(1.12, 1.08, 1);
    }

    camera.fov = 23;
    camera.updateProjectionMatrix();
    camera.position.set(0, 0.96, 4.15);
    camera.lookAt(0, 0.84, 0);
    renderer.render(scene, camera);

    const out = document.createElement('canvas');
    out.width = 240;
    out.height = 240;
    const ctx = out.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    if (theme === 'pink') {
      grad.addColorStop(0, '#fdf2f8');
      grad.addColorStop(1, '#fbcfe8');
    } else if (theme === 'gold') {
      grad.addColorStop(0, '#3f3f46');
      grad.addColorStop(1, '#92400e');
    } else {
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(1, '#93c5fd');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 240);

    const srcSide = Math.min(canvas.width, canvas.height) * 0.90;
    const sx = (canvas.width - srcSide) / 2;
    const sy = (canvas.height - srcSide) / 2;
    ctx.drawImage(canvas, sx, sy, srcSide, srcSide, 0, 0, 240, 240);

    if (window.catSound && window.catSound.playBell) window.catSound.playBell();
    return out.toDataURL('image/png');
  } finally {
    hiddenProps.forEach((g, idx) => { g.visible = prevVis[idx]; });
    rig.catRoot.position.copy(prevCatPos);
    rig.catRoot.rotation.copy(prevCatRot);
    rig.headPivot.rotation.copy(prevHeadRot);
    rig.leftEye3D.upperLidPivot.rotation.x = prevUpL;
    rig.leftEye3D.lowerLidPivot.rotation.x = prevLoL;
    rig.rightEye3D.upperLidPivot.rotation.x = prevUpR;
    rig.rightEye3D.lowerLidPivot.rotation.x = prevLoR;
    rig.leftEye3D.eyeSocket.rotation.z = prevSockL;
    rig.rightEye3D.eyeSocket.rotation.z = prevSockR;
    rig.leftEye3D.pupilPivot.rotation.copy(prevPupilRotL);
    rig.rightEye3D.pupilPivot.rotation.copy(prevPupilRotR);
    rig.leftEye3D.pupil.scale.copy(prevPupilScale);
    rig.rightEye3D.pupil.scale.copy(prevPupilScale);
    rig.blushMat.opacity = prevBlush;
    rig.tonguePivot.visible = prevTongue;
    rig.tonguePivot.scale.copy(prevTongueScale);
    camera.fov = prevFov;
    camera.updateProjectionMatrix();
    camera.position.copy(prevCamPos);
    camera.quaternion.copy(prevCamQuat);
    renderer.render(scene, camera);
  }
}

function animate() {
  update3DScene();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
