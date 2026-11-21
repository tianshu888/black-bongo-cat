import * as THREE from 'three';
import { getCareerInfo } from './careers.js';

export function createBehaviorSystem({ rig, props, state, userSettings, gameState, onPersistGame }) {
  const behavior = {
    mode: gameState.isExhausted ? 'exhausted' : 'work', // work | exhausted | feedKibble | feedCan | feedChuru | playWand | playYarn | groom | stretch | loaf | nap | tailChase | zoomies | bugHunt | boxPeek
    timer: 0,
    duration: 0,
    phase: 0,
    lastInputTime: performance.now(),
    nextIdleTrigger: 24000 + Math.random() * 14000,
    lastExhaustedHint: 0,

    // Micro animations
    earTwitchSide: 0, // -1 left, 1 right, 0 none
    earTwitchTimer: 0,
    nextEarTwitch: 260,
    slowBlinkTimer: 0,
    nextSlowBlink: 520,

    // Interactive counters
    subStep: 0,
    subTimer: 0,
    wandHits: 0,
    wandHitCooldown: 0,
    churuLicks: 0,
    churuCooldown: 0,

    // Yarn physics
    yarnPos: new THREE.Vector3(-1.35, -0.5, 0.72),
    yarnVel: new THREE.Vector3(0.05, 0.04, 0),

    // Bug flight
    bugPos: new THREE.Vector3(-1.5, 1.4, 0.4),
    bugAngle: 0,
    bugCaught: false,

    // Zoomies sprint
    zoomX: 0,
    zoomDir: -1,
    zoomBounces: 0,

    // Throttled persistence
    dirtyGameSave: false,
    lastSaveTime: performance.now(),
    lastClickCoinTime: 0,
    comboCount: 0,
    lastKeyTime: 0
  };

  function canWork() {
    return !gameState.isExhausted && behavior.mode !== 'exhausted';
  }

  function enterExhausted() {
    gameState.energy = 0;
    gameState.isExhausted = true;
    hideAllTempProps();
    behavior.mode = 'exhausted';
    behavior.timer = 0;
    if (window.catSound.playYawn) window.catSound.playYawn();
    props.spawnFxText('累趴啦…回体中', '#f87171', new THREE.Vector3(0.2, 1.05, 0.5), 0.018, 52);
    onPersistGame(gameState);
  }

  function onExhaustedTap() {
    const now = performance.now();
    if (now - behavior.lastExhaustedHint > 2200) {
      behavior.lastExhaustedHint = now;
      props.spawnFxText('💤 回体中 喂食秒醒', '#fca5a5', new THREE.Vector3(0.2, 0.95, 0.5), 0.016, 42);
    }
  }

  function markActiveWork() {
    behavior.lastInputTime = performance.now();
    if (!canWork()) return;
    // Typing or working immediately exits autonomous rest/play & vanishes temporary props!
    if (['loaf', 'nap', 'groom', 'stretch', 'tailChase', 'zoomies', 'bugHunt', 'boxPeek', 'playYarn'].includes(behavior.mode)) {
      exitToWork();
    }
  }

  function hideAllTempProps() {
    props.foodBowlGroup.visible = false;
    props.tunaCanGroup.visible = false;
    props.churuGroup.visible = false;
    props.wandGroup.visible = false;
    props.yarnGroup.visible = false;
    props.bugGroup.visible = false;
    props.boxGroup.visible = false;
    rig.tonguePivot.visible = false;
    rig.torsoMesh.scale.set(1, 1, 1);
    rig.leftEar.rotation.set(0.08, 0.12, 0.24);
    rig.rightEar.rotation.set(0.08, -0.12, -0.24);
  }

  function exitToWork() {
    behavior.mode = 'work';
    behavior.timer = 0;
    behavior.zoomX = 0;
    hideAllTempProps();
  }

  function addStats({ coins = 0, hunger = 0, mood = 0, energy = 0, affection = 0, workXp = 0, statsDelta = null }) {
    const prevCareer = getCareerInfo(gameState.workXp || 0).current;
    if (coins) gameState.coins = Math.max(0, Math.round((gameState.coins || 0) + coins));
    if (hunger) gameState.hunger = Math.max(0, Math.min(100, (gameState.hunger ?? 80) + hunger));
    if (mood) gameState.mood = Math.max(0, Math.min(100, (gameState.mood ?? 80) + mood));
    if (energy) gameState.energy = Math.max(0, Math.min(100, (gameState.energy ?? 90) + energy));
    if (affection) gameState.affection = Math.max(0, (gameState.affection || 0) + affection);
    if (workXp) gameState.workXp = Math.max(0, (gameState.workXp || 0) + workXp);
    if (statsDelta) {
      gameState.stats = gameState.stats || {};
      for (const [k, v] of Object.entries(statsDelta)) {
        gameState.stats[k] = (gameState.stats[k] || 0) + v;
      }
    }
    const nextCareer = getCareerInfo(gameState.workXp || 0).current;
    if (nextCareer.level > prevCareer.level) {
      const bonus = nextCareer.promoteBonus || 0;
      if (bonus > 0) gameState.coins = Math.max(0, Math.round((gameState.coins || 0) + bonus));
      gameState.energy = Math.min(100, (gameState.energy ?? 90) + 25);
      gameState.mood = Math.min(100, (gameState.mood ?? 80) + 15);
      gameState.isExhausted = false;
      if (window.catSound.playCoin) window.catSound.playCoin();
      const promoLabel = nextCareer.level === 2 ? `转正啦 ${nextCareer.title}!` : `升职 ${nextCareer.title}!`;
      props.spawnFxText(promoLabel, '#a3e635', new THREE.Vector3(0.2, 1.38, 0.5), 0.016, 70);
      if (bonus > 0) {
        props.spawnFxText(`+${bonus} 红包`, '#fde047', new THREE.Vector3(0.2, 1.12, 0.5), 0.017, 65);
      }
    }
    behavior.dirtyGameSave = true;
  }

  function computeWorkPayout(career) {
    let payout = career.baseCoin;
    let isCrit = false;
    const moodBonus = (gameState.mood ?? 80) >= 80 ? 0.08 : 0;
    if (Math.random() < career.critChance + moodBonus) {
      payout += Math.max(1, career.critBonus);
      isCrit = true;
    }
    return { payout, isCrit };
  }

  function onWorkKey(keyWorldPos) {
    if (!canWork()) {
      onExhaustedTap();
      return false;
    }
    markActiveWork();
    const now = performance.now();
    if (now - behavior.lastKeyTime < 1500) behavior.comboCount++;
    else behavior.comboCount = 1;
    behavior.lastKeyTime = now;

    const career = getCareerInfo(gameState.workXp || 0).current;
    const hungryPenalty = (gameState.hunger ?? 80) < 15 ? 1.5 : 1.0;
    const comboMult = behavior.comboCount >= 45 ? 1.5 : 1.0;
    const { payout: rawPayout, isCrit } = computeWorkPayout(career);
    const payout = Math.round(rawPayout * comboMult);
    const staminaDrain = 0.42 * career.staminaCostMult * hungryPenalty;

    addStats({ coins: payout, hunger: -0.22, energy: -staminaDrain, workXp: 1, statsDelta: { totalKeys: 1 } });

    if (userSettings.showFloatingCoins && keyWorldPos) {
      const p = keyWorldPos.clone();
      p.y += 0.26;
      const fxText = isCrit ? `爆单+${payout}` : `+${payout}`;
      props.spawnFxText(fxText, isCrit ? '#fb923c' : (payout > 1 ? '#facc15' : '#fde047'), p, isCrit ? 0.018 : 0.024, 34);
    }
    if ((gameState.energy ?? 0) <= 0) enterExhausted();
    return true;
  }

  function onWorkClick() {
    if (!canWork()) {
      onExhaustedTap();
      return false;
    }
    markActiveWork();
    const now = performance.now();
    if (now - behavior.lastClickCoinTime < 180) return true; // Anti-macro burst cap
    behavior.lastClickCoinTime = now;

    const career = getCareerInfo(gameState.workXp || 0).current;
    const hungryPenalty = (gameState.hunger ?? 80) < 15 ? 1.5 : 1.0;
    const { payout, isCrit } = computeWorkPayout(career);
    const staminaDrain = 0.22 * career.staminaCostMult * hungryPenalty;

    addStats({ coins: payout, hunger: -0.10, energy: -staminaDrain, workXp: 1, statsDelta: { totalClicks: 1 } });
    if (userSettings.showFloatingCoins) {
      const p = props.mouseGroup.position.clone();
      p.y += 0.25;
      const fxText = isCrit ? `爆单+${payout}` : `+${payout}`;
      props.spawnFxText(fxText, isCrit ? '#fb923c' : '#fde047', p, isCrit ? 0.018 : 0.022, 32);
    }
    if ((gameState.energy ?? 0) <= 0) enterExhausted();
    return true;
  }

  let petSessionGain = 0;
  function onPetPulse(worldHeadPos) {
    behavior.lastInputTime = performance.now();
    if (petSessionGain < 12) {
      petSessionGain += 0.35;
      addStats({ mood: 0.45, affection: 0.35, statsDelta: { totalPets: 0 } });
    }
    if (Math.random() < 0.06) {
      const p = worldHeadPos.clone();
      p.x += (Math.random() - 0.5) * 0.55;
      p.y += 0.65;
      p.z += 0.2;
      props.spawnFxText('♥', '#fb7185', p, 0.020, 38);
    }
  }

  function onPetEnd() {
    if (petSessionGain > 0.5) {
      addStats({ statsDelta: { totalPets: 1 } });
    }
    petSessionGain = 0;
  }

  function startMode(type) {
    hideAllTempProps();
    behavior.mode = type;
    behavior.timer = 0;
    behavior.subStep = 0;
    behavior.subTimer = 0;
    behavior.zoomX = 0;
    behavior.lastInputTime = performance.now();

    if (type === 'feedKibble') {
      gameState.isExhausted = false;
      behavior.duration = 280;
      props.foodBowlGroup.visible = true;
      props.foodBowlGroup.scale.set(0.01, 0.01, 0.01);
      props.foodBowlGroup.position.set(1.48, -0.82, 0.58);
    } else if (type === 'feedCan') {
      gameState.isExhausted = false;
      behavior.duration = 300;
      props.tunaCanGroup.visible = true;
      props.tunaCanGroup.scale.set(0.01, 0.01, 0.01);
      props.tunaCanGroup.position.set(1.48, -0.82, 0.58);
    } else if (type === 'feedChuru') {
      gameState.isExhausted = false;
      behavior.duration = 600;
      behavior.churuLicks = 0;
      behavior.churuCooldown = 0;
      props.churuGroup.visible = true;
    } else if (type === 'playWand') {
      behavior.duration = 900;
      behavior.wandHits = 0;
      behavior.wandHitCooldown = 0;
      props.wandGroup.visible = true;
    } else if (type === 'playYarn') {
      behavior.duration = 650;
      props.yarnGroup.visible = true;
      behavior.yarnPos.set(-1.35, -0.35, 0.72);
      behavior.yarnVel.set(0.075, 0.06, 0);
    } else if (type === 'groom') {
      behavior.duration = 220;
    } else if (type === 'stretch') {
      behavior.duration = 190;
      if (window.catSound.playYawn) window.catSound.playYawn();
    } else if (type === 'loaf') {
      behavior.duration = 540;
    } else if (type === 'nap') {
      behavior.duration = 720;
    } else if (type === 'tailChase') {
      behavior.duration = 220;
    } else if (type === 'zoomies') {
      behavior.duration = 240;
      behavior.zoomX = 0;
      behavior.zoomDir = Math.random() < 0.5 ? -1 : 1;
      behavior.zoomBounces = 0;
    } else if (type === 'bugHunt') {
      behavior.duration = 380;
      behavior.bugCaught = false;
      behavior.bugAngle = 0;
      props.bugGroup.visible = true;
      behavior.bugPos.set(Math.random() < 0.5 ? -1.8 : 1.8, 1.35, 0.35);
    } else if (type === 'boxPeek') {
      behavior.duration = 340;
      props.boxGroup.visible = true;
      props.boxGroup.scale.set(0.01, 0.01, 0.01);
    }
  }

  function handleAction(action) {
    if (!action || !action.type) return;
    const map = {
      feedKibble: 'feedKibble',
      feedChuru: 'feedChuru',
      feedCan: 'feedCan',
      playWand: 'playWand',
      playYarn: 'playYarn',
      demoLoaf: 'loaf',
      demoGroom: 'groom',
      demoStretch: 'stretch',
      demoNap: 'nap',
      demoZoomies: 'zoomies',
      demoBug: 'bugHunt',
      demoBox: 'boxPeek'
    };
    const m = map[action.type];
    if (m) startMode(m);
  }

  // Triggered when user clicks an interactive prop (yarn ball or bug!) inside the pet window
  function handleStageClick(worldCursorPos) {
    if (behavior.mode === 'bugHunt' && !behavior.bugCaught) {
      // User gently shoos bug right toward cat's paws!
      behavior.bugPos.lerp(new THREE.Vector3(0.18, 0.35, 0.55), 0.7);
      if (window.catSound.playSwat) window.catSound.playSwat(false);
    } else if (behavior.mode === 'playYarn') {
      behavior.yarnVel.x = (0.18 - behavior.yarnPos.x) * 0.065;
      behavior.yarnVel.y = 0.095;
      if (window.catSound.playSwat) window.catSound.playSwat(true);
    }
  }

  // Helper to get 3D cursor position near Z = 1.0 plane
  const cursorWorldVec = new THREE.Vector3();
  const tempRayDir = new THREE.Vector3();
  function getCursorWorldAtZ(ndcPointer, camera, targetZ) {
    cursorWorldVec.set(ndcPointer.x, ndcPointer.y, 0.5).unproject(camera);
    tempRayDir.copy(cursorWorldVec).sub(camera.position).normalize();
    const dist = (targetZ - camera.position.z) / tempRayDir.z;
    return cursorWorldVec.copy(camera.position).add(tempRayDir.multiplyScalar(dist));
  }

  // Computes posture/limb overrides for active non-work mode; returns null if mode === 'work'
  function step(now, ndcPointer, camera) {
    behavior.timer++;

    // Gentle passive stat drift & rest recovery (~once per second)
    if (behavior.timer % 60 === 0) {
      if (behavior.mode === 'exhausted') {
        const recRate = (gameState.hunger ?? 80) < 15 ? 1.1 : 1.9;
        gameState.energy = Math.min(100, (gameState.energy ?? 0) + recRate);
        behavior.dirtyGameSave = true;
        if (gameState.energy >= 22) {
          gameState.isExhausted = false;
          props.spawnFxText('⚡ 恢复精力!', '#a3e635', new THREE.Vector3(0.2, 1.05, 0.5), 0.02, 36);
          exitToWork();
        }
      } else if (['loaf', 'nap'].includes(behavior.mode)) {
        gameState.energy = Math.min(100, (gameState.energy ?? 90) + 1.5);
        behavior.dirtyGameSave = true;
      } else {
        gameState.hunger = Math.max(0, (gameState.hunger ?? 80) - 0.06);
        gameState.mood = Math.max(0, (gameState.mood ?? 80) - 0.04);
      }
      // Check unlockable accessories by bond level
      const lv = Math.max(1, Math.floor(Math.sqrt((gameState.affection || 0) / 25)) + 1);
      const unlocked = new Set(gameState.unlockedAccessories || ['none']);
      if (lv >= 2) unlocked.add('bell');
      if (lv >= 3) unlocked.add('bowtie');
      if (lv >= 4) unlocked.add('headphones');
      if (lv >= 5) unlocked.add('beret');
      gameState.unlockedAccessories = Array.from(unlocked);
    }

    // Throttled state save to main process
    if (behavior.dirtyGameSave && now - behavior.lastSaveTime > 2000) {
      behavior.dirtyGameSave = false;
      behavior.lastSaveTime = now;
      onPersistGame(gameState);
    }

    // Random micro ear twitches
    behavior.nextEarTwitch--;
    if (behavior.nextEarTwitch <= 0) {
      behavior.earTwitchSide = Math.random() < 0.5 ? -1 : 1;
      behavior.earTwitchTimer = 14;
      behavior.nextEarTwitch = 240 + Math.floor(Math.random() * 420);
    }
    if (behavior.earTwitchTimer > 0) {
      behavior.earTwitchTimer--;
      const twitchAmt = Math.sin((behavior.earTwitchTimer / 14) * Math.PI * 2) * 0.22;
      if (behavior.mode !== 'zoomies') {
        rig.leftEar.rotation.z = 0.24 + (behavior.earTwitchSide === -1 ? twitchAmt : 0);
        rig.rightEar.rotation.z = -0.24 - (behavior.earTwitchSide === 1 ? twitchAmt : 0);
      }
    }

    // Autonomous idle transition check when in 'work' and not being petted
    if (behavior.mode === 'work' && !state.isPetting && !state.isDraggingWindow) {
      const idleMs = now - behavior.lastInputTime;
      if (idleMs > behavior.nextIdleTrigger) {
        behavior.nextIdleTrigger = 28000 + Math.random() * 22000;
        const pool = ['groom', 'loaf', 'stretch', 'tailChase'];
        if ((gameState.energy ?? 90) < 55) pool.push('nap', 'nap', 'loaf');
        if (!userSettings.focusNoDisturb) {
          if ((gameState.mood ?? 80) > 65) pool.push('zoomies', 'playYarn');
          pool.push('bugHunt', 'boxPeek');
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        startMode(pick);
      }
      return null;
    }

    if (behavior.mode === 'work') return null;

    // Default behavior frame overrides
    const ov = {
      yaw: 0, pitch: 0, roll: 0, bodyX: 0, bodyY: 0,
      squint: 0, dilate: 1.0, blush: 0,
      rightPawPos: null, leftPawPos: null,
      rightElbowOffset: null, leftElbowOffset: null,
      rightShoulder: null, leftShoulder: null,
      tailSpeed: 0.05, tailHigh: 0,
      isInteractivePropActive: false
    };

    const t = behavior.timer;

    // =========================================================================
    // 0. EXHAUSTED RESTING (Out of stamina -> slumped flat, slow recovery!)
    // =========================================================================
    if (behavior.mode === 'exhausted') {
      ov.bodyY = -0.17 + Math.sin(t * 0.05) * 0.018;
      ov.pitch = 0.30 + Math.sin(t * 0.05) * 0.025;
      ov.roll = 0.05;
      ov.squint = 0.90;
      ov.tailSpeed = 0.015;
      rig.torsoMesh.scale.set(1.08, 0.88, 1.04);
      ov.rightPawPos = new THREE.Vector3(-0.24, -0.74, 0.54);
      ov.leftPawPos = new THREE.Vector3(0.24, -0.74, 0.54);
      if (t % 85 === 25) {
        props.spawnFxText('Zzz', '#94a3b8', new THREE.Vector3(0.35, 1.05, 0.4), 0.015, 48);
      }
      return ov;
    }

    // =========================================================================
    // 1. FEEDING MODES (Bowl/Can pop in -> Eat -> Rapid Stamina Recovery!)
    // =========================================================================
    if (behavior.mode === 'feedKibble' || behavior.mode === 'feedCan') {
      const isCan = behavior.mode === 'feedCan';
      const prop = isCan ? props.tunaCanGroup : props.foodBowlGroup;
      const enterS = Math.min(1, t / 18);
      const exitS = t > behavior.duration - 24 ? Math.max(0, (behavior.duration - t) / 24) : 1;
      const sc = enterS * exitS;
      prop.scale.set(sc, sc, sc);

      if (t > 20 && t < behavior.duration - 35) {
        const chew = Math.sin(t * 0.42);
        ov.bodyX = 0.28;
        ov.bodyY = -0.10 + Math.max(0, chew) * 0.03;
        ov.yaw = 0.56;
        ov.pitch = 0.34 + chew * 0.14;
        ov.squint = 0.72;
        ov.blush = 0.38;
        ov.tailSpeed = 0.14;
        rig.tonguePivot.visible = t % 16 < 7;
        rig.tonguePivot.rotation.x = 0.25 + chew * 0.25;
        if (t % 22 === 0 && window.catSound.playCrunch) window.catSound.playCrunch();
        if (isCan && t % 28 === 0) {
          props.spawnFxText('♥', '#fb7185', new THREE.Vector3(0.45, 0.85, 0.4), 0.02, 34);
        }
      } else if (t >= behavior.duration - 35) {
        ov.squint = 0.9;
        ov.blush = 0.45;
        rig.tonguePivot.visible = t % 14 < 7;
      }

      if (t >= behavior.duration) {
        if (isCan) {
          addStats({ hunger: 75, energy: 100, mood: 45, affection: 30, statsDelta: { feedCount: 1 } });
          if (window.catSound.playCoin) window.catSound.playCoin();
        } else {
          addStats({ hunger: 35, energy: 35, mood: 6, affection: 5, statsDelta: { feedCount: 1 } });
        }
        onPersistGame(gameState);
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 2. CHURU TREAT LICKING (Cursor holds Churu stick, cat tracks & licks!)
    // =========================================================================
    if (behavior.mode === 'feedChuru') {
      ov.isInteractivePropActive = true;
      const wPos = getCursorWorldAtZ(ndcPointer, camera, 1.05);
      wPos.x = Math.max(-2.2, Math.min(2.2, wPos.x));
      wPos.y = Math.max(-0.9, Math.min(1.5, wPos.y));
      props.churuGroup.position.copy(wPos);

      const dx = wPos.x - 0.18;
      const dy = wPos.y - 0.75;
      const dist = Math.hypot(dx, dy);
      ov.yaw = Math.max(-0.75, Math.min(0.75, dx * 0.45));
      ov.pitch = Math.max(-0.4, Math.min(0.45, -dy * 0.45));
      ov.dilate = 1.48;
      ov.blush = 0.35;

      if (behavior.churuCooldown > 0) behavior.churuCooldown--;
      if (dist < 1.15 && behavior.churuCooldown <= 0) {
        rig.tonguePivot.visible = true;
        rig.tonguePivot.rotation.x = 0.15 + Math.sin(t * 0.75) * 0.35;
        ov.squint = 0.65;
        if (t % 12 === 0) {
          behavior.churuLicks++;
          behavior.churuCooldown = 6;
          if (window.catSound.playLick) window.catSound.playLick();
          props.spawnFxText('♥', '#fb7185', new THREE.Vector3(0.2 + dx * 0.3, 0.9, 0.5), 0.02, 26);
        }
      } else {
        rig.tonguePivot.visible = false;
      }

      if (behavior.churuLicks >= 9 || t >= behavior.duration) {
        addStats({ hunger: 25, energy: 45, mood: 28, affection: 18, statsDelta: { feedCount: 1 } });
        if (window.catSound.playCoin) window.catSound.playCoin();
        onPersistGame(gameState);
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 3. FEATHER WAND PLAY (Cursor waves feather wand -> cat bats 5 times!)
    // =========================================================================
    if (behavior.mode === 'playWand') {
      ov.isInteractivePropActive = true;
      const wPos = getCursorWorldAtZ(ndcPointer, camera, 1.0);
      wPos.x = Math.max(-2.3, Math.min(2.3, wPos.x));
      wPos.y = Math.max(-0.9, Math.min(1.6, wPos.y));
      props.wandGroup.position.copy(wPos);
      props.wandGroup.rotation.z = Math.sin(t * 0.25) * 0.22;

      const dx = wPos.x - 0.18;
      const dy = wPos.y - 0.55;
      const dist = Math.hypot(dx, dy);
      ov.yaw = Math.max(-0.8, Math.min(0.8, dx * 0.5));
      ov.pitch = Math.max(-0.45, Math.min(0.4, -dy * 0.4));
      ov.bodyY = -0.06;
      ov.dilate = 1.52;
      ov.tailSpeed = 0.18;

      if (behavior.wandHitCooldown > 0) behavior.wandHitCooldown--;
      if (dist < 1.38 && behavior.wandHitCooldown <= 0) {
        behavior.wandHitCooldown = 26;
        behavior.wandHits++;
        if (window.catSound.playBell) window.catSound.playBell();
        if (window.catSound.playSwat) window.catSound.playSwat(true);
        const swipeTarget = new THREE.Vector3(Math.max(-1.05, Math.min(1.05, wPos.x - 0.18)), Math.max(-0.4, Math.min(0.6, wPos.y - 0.02)), 0.85);
        if (dx < 0) ov.rightPawPos = swipeTarget;
        else ov.leftPawPos = swipeTarget;
        props.spawnFxText('✨', '#fde047', wPos.clone(), 0.025, 24);
      } else if (behavior.wandHitCooldown > 16) {
        const swipeTarget = new THREE.Vector3(Math.max(-1.0, Math.min(1.0, wPos.x - 0.18)), Math.max(-0.4, Math.min(0.5, wPos.y - 0.02)), 0.85);
        if (dx < 0) ov.rightPawPos = swipeTarget;
        else ov.leftPawPos = swipeTarget;
      }

      if (behavior.wandHits >= 5 || t >= behavior.duration) {
        if (behavior.wandHits >= 5) {
          addStats({ coins: 20, mood: 35, affection: 20, energy: -8 });
          if (window.catSound.playCoin) window.catSound.playCoin();
          props.spawnFxText('+20 💰', '#fde047', new THREE.Vector3(0.2, 1.15, 0.5), 0.022, 42);
        } else {
          addStats({ mood: 15, affection: 8 });
        }
        onPersistGame(gameState);
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 4. YARN BALL PLAY (Cat bats bouncing pastel ball left/right!)
    // =========================================================================
    if (behavior.mode === 'playYarn') {
      ov.isInteractivePropActive = true;
      behavior.yarnVel.y -= 0.0055;
      behavior.yarnPos.add(behavior.yarnVel);
      if (behavior.yarnPos.y < -0.78) {
        behavior.yarnPos.y = -0.78;
        behavior.yarnVel.y = Math.abs(behavior.yarnVel.y) * 0.65;
        behavior.yarnVel.x *= 0.94;
      }
      if (behavior.yarnPos.x < -1.95) {
        behavior.yarnPos.x = -1.95;
        behavior.yarnVel.x = Math.abs(behavior.yarnVel.x) * 0.88;
      }
      if (behavior.yarnPos.x > 1.95) {
        behavior.yarnPos.x = 1.95;
        behavior.yarnVel.x = -Math.abs(behavior.yarnVel.x) * 0.88;
      }
      // Cat bats yarn ball back whenever it comes close!
      if (Math.abs(behavior.yarnPos.x - 0.18) < 0.95 && behavior.yarnPos.y < -0.4 && Math.abs(behavior.yarnVel.x) < 0.12 && t % 28 === 0) {
        const dir = behavior.yarnPos.x < 0.18 ? -1 : 1;
        behavior.yarnVel.x = dir * (0.09 + Math.random() * 0.05);
        behavior.yarnVel.y = 0.075;
        if (window.catSound.playSwat) window.catSound.playSwat(true);
      }

      const fadeScale = t > behavior.duration - 25 ? Math.max(0, (behavior.duration - t) / 25) : 1;
      props.yarnGroup.position.copy(behavior.yarnPos);
      props.yarnGroup.scale.set(fadeScale, fadeScale, fadeScale);
      props.yarnGroup.rotation.z -= behavior.yarnVel.x * 2.5;
      props.yarnGroup.rotation.x += 0.04;

      ov.yaw = Math.max(-0.75, Math.min(0.75, (behavior.yarnPos.x - 0.18) * 0.45));
      ov.pitch = 0.25;
      ov.dilate = 1.38;
      ov.tailSpeed = 0.14;
      if (behavior.yarnPos.x < 0.18 && behavior.yarnPos.x > -1.1) {
        ov.rightPawPos = new THREE.Vector3(behavior.yarnPos.x - 0.18, Math.max(-0.75, behavior.yarnPos.y + 0.12), 0.78);
      } else if (behavior.yarnPos.x >= 0.18 && behavior.yarnPos.x < 1.2) {
        ov.leftPawPos = new THREE.Vector3(behavior.yarnPos.x - 0.18, Math.max(-0.75, behavior.yarnPos.y + 0.12), 0.78);
      }

      if (t >= behavior.duration) {
        addStats({ mood: 25, affection: 10, energy: -6 });
        onPersistGame(gameState);
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 5. GROOM (Lick right paw & wipe cheek/ear!)
    // =========================================================================
    if (behavior.mode === 'groom') {
      const cycle = t % 75;
      if (cycle < 30) {
        // Lick paw
        ov.yaw = -0.18;
        ov.pitch = 0.16;
        ov.squint = 0.45;
        ov.rightPawPos = new THREE.Vector3(-0.18, 0.08, 0.72);
        rig.tonguePivot.visible = cycle % 14 < 7;
        rig.tonguePivot.rotation.x = 0.2 + Math.sin(cycle * 0.6) * 0.25;
        if (cycle === 8 || cycle === 20) {
          if (window.catSound.playLick) window.catSound.playLick();
        }
      } else {
        // Wipe circularly over cheek
        rig.tonguePivot.visible = false;
        const a = ((cycle - 30) / 45) * Math.PI * 2;
        ov.yaw = -0.25;
        ov.roll = 0.16;
        ov.squint = 0.85;
        ov.rightPawPos = new THREE.Vector3(-0.34 + Math.cos(a) * 0.10, 0.24 + Math.sin(a) * 0.12, 0.74);
      }
      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    // =========================================================================
    // 6. KITTY STRETCH (Stretch paws forward low, tail high, tremble yawn!)
    // =========================================================================
    if (behavior.mode === 'stretch') {
      const p = Math.sin(Math.min(1, t / behavior.duration) * Math.PI);
      ov.bodyY = -0.18 * p;
      ov.pitch = -0.18 * p;
      ov.squint = 0.85 * p;
      ov.tailHigh = 0.72 * p + (t > 45 && t < 130 ? Math.sin(t * 0.8) * 0.06 : 0);
      ov.rightPawPos = new THREE.Vector3(-0.32, -0.74, 0.82 + 0.14 * p);
      ov.leftPawPos = new THREE.Vector3(0.32, -0.74, 0.82 + 0.14 * p);
      rig.tonguePivot.visible = t > 35 && t < 110;
      rig.torsoMesh.scale.set(1 + 0.06 * p, 1 - 0.10 * p, 1 + 0.12 * p);
      if (t >= behavior.duration) {
        addStats({ energy: 8, mood: 6 });
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 7. CAT LOAF (Tucked paws underneath squished plush body)
    // =========================================================================
    if (behavior.mode === 'loaf') {
      ov.bodyY = -0.12;
      ov.pitch = 0.06;
      ov.squint = 0.62;
      ov.blush = 0.18;
      ov.tailSpeed = 0.02;
      rig.torsoMesh.scale.set(1.10, 0.88, 1.04);
      ov.rightPawPos = new THREE.Vector3(-0.18, -0.74, 0.42);
      ov.leftPawPos = new THREE.Vector3(0.18, -0.74, 0.42);
      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    // =========================================================================
    // 8. DESK NAP (Sleepy chin rest + floating Zzz!)
    // =========================================================================
    if (behavior.mode === 'nap') {
      ov.bodyY = -0.14 + Math.sin(t * 0.04) * 0.015;
      ov.pitch = 0.28 + Math.sin(t * 0.04) * 0.03;
      ov.roll = 0.08;
      ov.squint = 1.0;
      ov.tailSpeed = 0.015;
      rig.torsoMesh.scale.set(1.06, 0.92, 1.02);
      ov.rightPawPos = new THREE.Vector3(-0.22, -0.74, 0.50);
      ov.leftPawPos = new THREE.Vector3(0.22, -0.74, 0.50);
      if (t % 70 === 20) {
        props.spawnFxText('Zzz', '#cbd5e1', new THREE.Vector3(0.35, 1.15, 0.4), 0.016, 52);
      }
      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    // =========================================================================
    // 9. TAIL CHASE (Tilts head staring at wagging tail & swipes paw!)
    // =========================================================================
    if (behavior.mode === 'tailChase') {
      ov.yaw = 0.68;
      ov.roll = 0.26;
      ov.pitch = 0.20;
      ov.dilate = 1.42;
      ov.tailSpeed = 0.24;
      const lunge = Math.sin(t * 0.18) > 0.4;
      if (lunge) {
        ov.leftPawPos = new THREE.Vector3(0.75, -0.48, 0.35);
      }
      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    // =========================================================================
    // 10. 3AM ZOOMIES (Airplane ears, giant pupils, dash bounce left-right!)
    // =========================================================================
    if (behavior.mode === 'zoomies') {
      // Airplane ears flattened!
      rig.leftEar.rotation.set(-0.35, 0.25, 0.78);
      rig.rightEar.rotation.set(-0.35, -0.25, -0.78);
      ov.dilate = 1.56;
      ov.tailSpeed = 0.32;
      ov.tailHigh = 0.45;

      const speed = 0.095;
      behavior.zoomX += behavior.zoomDir * speed;
      if (behavior.zoomX < -1.55) {
        behavior.zoomX = -1.55;
        behavior.zoomDir = 1;
        behavior.zoomBounces++;
        if (window.catSound.playSwat) window.catSound.playSwat(false);
      } else if (behavior.zoomX > 1.35) {
        behavior.zoomX = 1.35;
        behavior.zoomDir = -1;
        behavior.zoomBounces++;
        if (window.catSound.playSwat) window.catSound.playSwat(false);
      }
      ov.bodyX = behavior.zoomX;
      ov.bodyY = Math.abs(Math.sin(t * 0.42)) * 0.22;
      ov.yaw = behavior.zoomDir * 0.55;
      ov.roll = -behavior.zoomDir * 0.18;

      if (behavior.zoomBounces >= 3 && Math.abs(behavior.zoomX) < 0.15) {
        addStats({ mood: 15, energy: -10 });
        onPersistGame(gameState);
        exitToWork();
      } else if (t >= behavior.duration) {
        exitToWork();
      }
      return ov;
    }

    // =========================================================================
    // 11. BUG HUNT (Ekekek crouch -> pounce & catch glowing moth for +20 coins!)
    // =========================================================================
    if (behavior.mode === 'bugHunt') {
      ov.isInteractivePropActive = true;
      behavior.bugAngle += 0.055;
      props.bugWingL.rotation.y = Math.sin(t * 0.9) * 0.8;
      props.bugWingR.rotation.y = -Math.sin(t * 0.9) * 0.8;

      if (!behavior.bugCaught) {
        if (t < 150) {
          // Flutter around top-center
          const tx = Math.sin(behavior.bugAngle * 1.3) * 1.45;
          const ty = 0.95 + Math.cos(behavior.bugAngle * 2.1) * 0.35;
          behavior.bugPos.x += (tx - behavior.bugPos.x) * 0.04;
          behavior.bugPos.y += (ty - behavior.bugPos.y) * 0.04;
          // Ekekek chatter stance!
          ov.bodyY = -0.10;
          ov.yaw = Math.max(-0.78, Math.min(0.78, (behavior.bugPos.x - 0.18) * 0.55));
          ov.pitch = -0.24 + Math.sin(t * 1.2) * 0.04;
          ov.dilate = 1.56;
          ov.tailSpeed = 0.25;
        } else {
          // Swoop lower within paw reach -> Pounce & catch!
          behavior.bugPos.lerp(new THREE.Vector3(0.18, 0.25, 0.72), 0.08);
          ov.bodyY = 0.18;
          ov.rightPawPos = new THREE.Vector3(-0.18, 0.15, 0.86);
          ov.leftPawPos = new THREE.Vector3(0.18, 0.15, 0.86);
          ov.dilate = 1.56;
          if (t >= 175 || behavior.bugPos.distanceTo(new THREE.Vector3(0.18, 0.25, 0.72)) < 0.22) {
            behavior.bugCaught = true;
            props.bugGroup.visible = false;
            if (window.catSound.playSwat) window.catSound.playSwat(true);
            if (window.catSound.playCoin) window.catSound.playCoin();
            addStats({ coins: 20, mood: 25, affection: 12, energy: -5, workXp: 15, statsDelta: { bugsCaught: 1 } });
            onPersistGame(gameState);
            props.spawnFxText('+20 🦋', '#fde047', new THREE.Vector3(0.25, 0.95, 0.6), 0.022, 46);
            behavior.duration = t + 45;
          }
        }
        props.bugGroup.position.copy(behavior.bugPos);
      } else {
        ov.squint = 0.85;
        ov.blush = 0.4;
        ov.tailSpeed = 0.22;
      }

      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    // =========================================================================
    // 12. CARDBOARD BOX PEEK
    // =========================================================================
    if (behavior.mode === 'boxPeek') {
      const enterS = Math.min(1, t / 18);
      const exitS = t > behavior.duration - 22 ? Math.max(0, (behavior.duration - t) / 22) : 1;
      const sc = enterS * exitS;
      props.boxGroup.scale.set(sc, sc, sc);
      ov.bodyY = -0.34 * sc;
      ov.pitch = -0.08;
      ov.dilate = 1.35;
      ov.rightPawPos = new THREE.Vector3(-0.26, -0.36, 0.78);
      ov.leftPawPos = new THREE.Vector3(0.26, -0.36, 0.78);
      if (t >= behavior.duration) exitToWork();
      return ov;
    }

    return null;
  }

  return {
    behavior,
    canWork,
    onWorkKey,
    onWorkClick,
    onPetPulse,
    onPetEnd,
    onExhaustedTap,
    markActiveWork,
    handleAction,
    handleStageClick,
    exitToWork,
    step
  };
}
