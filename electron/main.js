const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Always isolate pet userData so external ELECTRON_USER_DATA_DIR env vars never lock settings/GPU cache
app.setPath('userData', path.join(app.getPath('appData'), 'BlackBongoCatPet'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.showInactive();
      openSettingsWindow();
    }
  });
}

const BASE_W = 360;
const BASE_H = 334;

const DEFAULT_SETTINGS = {
  scale: 1.0,
  keyboardTheme: 'classic',
  mouseColor: 'white',
  catCoat: 'black',
  eyeColor: 'lime',
  showFloatingKeys: true,
  showImpactGlow: true,
  soundEnabled: true,
  alwaysOnTop: true,
  lockPosition: false,
  windowPos: null
};

let mainWindow = null;
let settingsWindow = null;
let tray = null;
let uIOhook = null;
let currentSettings = { ...DEFAULT_SETTINGS };

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'bongo-settings.json');
}

function loadSettings() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
      if (typeof currentSettings.scale !== 'number' || Number.isNaN(currentSettings.scale)) {
        currentSettings.scale = 1.0;
      }
      currentSettings.scale = Math.max(0.5, Math.min(1.8, currentSettings.scale));
    }
  } catch (err) {
    console.warn('[BongoCat] Failed to load settings:', err.message);
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(currentSettings, null, 2));
  } catch (err) {
    console.warn('[BongoCat] Failed to save settings:', err.message);
  }
}

// Try loading uiohook-napi for global keyboard & mouse hook
try {
  const hookMod = require('uiohook-napi');
  uIOhook = hookMod.uIOhook;
  console.log('[BongoCat] uiohook-napi loaded successfully');
} catch (err) {
  console.warn('[BongoCat] uiohook-napi load warning (will fallback to screen cursor polling & local keys):', err.message);
}

// Map uiohook keycodes to visual key labels and virtual keyboard key IDs
const KEYCODE_MAP = {
  1: { label: 'ESC', id: 'Escape' },
  2: { label: '1', id: 'Digit1' },
  3: { label: '2', id: 'Digit2' },
  4: { label: '3', id: 'Digit3' },
  5: { label: '4', id: 'Digit4' },
  6: { label: '5', id: 'Digit5' },
  7: { label: '6', id: 'Digit6' },
  8: { label: '7', id: 'Digit7' },
  9: { label: '8', id: 'Digit8' },
  10: { label: '9', id: 'Digit9' },
  11: { label: '0', id: 'Digit0' },
  12: { label: '-', id: 'Minus' },
  13: { label: '=', id: 'Equal' },
  14: { label: '⌫', id: 'Backspace' },
  15: { label: '⇥', id: 'Tab' },
  16: { label: 'Q', id: 'KeyQ' },
  17: { label: 'W', id: 'KeyW' },
  18: { label: 'E', id: 'KeyE' },
  19: { label: 'R', id: 'KeyR' },
  20: { label: 'T', id: 'KeyT' },
  21: { label: 'Y', id: 'KeyY' },
  22: { label: 'U', id: 'KeyU' },
  23: { label: 'I', id: 'KeyI' },
  24: { label: 'O', id: 'KeyO' },
  25: { label: 'P', id: 'KeyP' },
  26: { label: '[', id: 'BracketLeft' },
  27: { label: ']', id: 'BracketRight' },
  28: { label: '↵', id: 'Enter' },
  29: { label: 'CTRL', id: 'ControlLeft' },
  30: { label: 'A', id: 'KeyA' },
  31: { label: 'S', id: 'KeyS' },
  32: { label: 'D', id: 'KeyD' },
  33: { label: 'F', id: 'KeyF' },
  34: { label: 'G', id: 'KeyG' },
  35: { label: 'H', id: 'KeyH' },
  36: { label: 'J', id: 'KeyJ' },
  37: { label: 'K', id: 'KeyK' },
  38: { label: 'L', id: 'KeyL' },
  39: { label: ';', id: 'Semicolon' },
  40: { label: "'", id: 'Quote' },
  41: { label: '`', id: 'Backquote' },
  42: { label: '⇧', id: 'ShiftLeft' },
  43: { label: '\\', id: 'Backslash' },
  44: { label: 'Z', id: 'KeyZ' },
  45: { label: 'X', id: 'KeyX' },
  46: { label: 'C', id: 'KeyC' },
  47: { label: 'V', id: 'KeyV' },
  48: { label: 'B', id: 'KeyB' },
  49: { label: 'N', id: 'KeyN' },
  50: { label: 'M', id: 'KeyM' },
  51: { label: ',', id: 'Comma' },
  52: { label: '.', id: 'Period' },
  53: { label: '/', id: 'Slash' },
  54: { label: '⇧', id: 'ShiftRight' },
  56: { label: 'ALT', id: 'AltLeft' },
  57: { label: '␣', id: 'Space', isSpace: true },
  58: { label: '⇪', id: 'CapsLock', isCaps: true },
  3613: { label: 'CTRL', id: 'ControlRight' },
  3640: { label: 'ALT', id: 'AltRight' },
  3675: { label: '⌘', id: 'MetaLeft' },
  57416: { label: '↑', id: 'ArrowUp' },
  57419: { label: '←', id: 'ArrowLeft' },
  57421: { label: '→', id: 'ArrowRight' },
  57424: { label: '↓', id: 'ArrowDown' }
};

function createCatTrayIcon() {
  // Build crisp 16x16 RGBA black-cat + chartreuse-eyes bitmap directly (100% reliable on Windows Tray)
  const w = 16;
  const h = 16;
  const buf = Buffer.alloc(w * h * 4, 0);
  const setPx = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    buf[idx] = b; buf[idx + 1] = g; buf[idx + 2] = r; buf[idx + 3] = a; // BGRA for createFromBitmap
  };
  for (let y = 3; y <= 13; y++) {
    for (let x = 2; x <= 13; x++) {
      const dx = (x - 7.5) / 5.4;
      const dy = (y - 8.5) / 4.8;
      if (dx * dx + dy * dy <= 1.0) setPx(x, y, 22, 22, 26);
    }
  }
  // Ears
  [[3,2],[4,2],[4,3],[3,3],[11,2],[12,2],[11,3],[12,3]].forEach(([ex, ey]) => setPx(ex, ey, 22, 22, 26));
  // Bright green eyes
  [[5,7],[5,8],[10,7],[10,8]].forEach(([ex, ey]) => setPx(ex, ey, 163, 230, 53));
  return nativeImage.createFromBitmap(buf, { width: w, height: h });
}

function createTray() {
  if (tray) return;
  try {
    tray = new Tray(createCatTrayIcon());
    tray.setToolTip('小黑猫 3D 桌宠 (点击打开设置 | 右键更多)');
    const buildMenu = () => Menu.buildFromTemplate([
      { label: '⚙ 自定义设置 (大小 / 粉键盘 / 配色)', click: () => openSettingsWindow() },
      { label: '✨ 演示打字', click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('trigger-demo');
      }},
      {
        label: '🔊 音效开关',
        type: 'checkbox',
        checked: Boolean(currentSettings.soundEnabled),
        click: () => {
          currentSettings.soundEnabled = !currentSettings.soundEnabled;
          saveSettings();
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('settings-changed', currentSettings);
          if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.webContents.send('settings-changed', currentSettings);
          tray.setContextMenu(buildMenu());
        }
      },
      {
        label: '🔒 锁定位置 (Alt+左键拖动)',
        type: 'checkbox',
        checked: Boolean(currentSettings.lockPosition),
        click: () => {
          currentSettings.lockPosition = !currentSettings.lockPosition;
          saveSettings();
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('settings-changed', currentSettings);
          if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.webContents.send('settings-changed', currentSettings);
          tray.setContextMenu(buildMenu());
        }
      },
      { label: '📍 重置到右下角', click: () => resetPetPosition() },
      { label: mainWindow && mainWindow.isVisible() ? '👁 隐藏小猫' : '👁 显示小猫', click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (mainWindow.isVisible()) mainWindow.hide(); else mainWindow.show();
        tray.setContextMenu(buildMenu());
      }},
      { type: 'separator' },
      { label: '✕ 退出桌宠', click: () => app.quit() }
    ]);
    tray.setContextMenu(buildMenu());
    tray.on('click', () => openSettingsWindow());
    tray.on('right-click', () => tray.setContextMenu(buildMenu()));
  } catch (err) {
    console.warn('[BongoCat] Tray init skipped:', err.message);
  }
}

function getDefaultWindowPos(winW, winH) {
  const cursorPt = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPt) || screen.getPrimaryDisplay();
  const { x: areaX, y: areaY, width: screenW, height: screenH } = activeDisplay.workArea;
  return {
    x: Math.round(areaX + screenW - winW - 60),
    y: Math.round(areaY + screenH - winH - 40),
    display: activeDisplay
  };
}

function resetPetPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const winW = Math.round(BASE_W * currentSettings.scale);
  const winH = Math.round(BASE_H * currentSettings.scale);
  const def = getDefaultWindowPos(winW, winH);
  currentSettings.windowPos = { x: def.x, y: def.y };
  saveSettings();
  mainWindow.setPosition(def.x, def.y);
}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  const catBounds = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow.getBounds()
    : { x: 1200, y: 500, width: 360, height: 334 };
  const area = (screen.getDisplayMatching(catBounds) || screen.getPrimaryDisplay()).workArea;
  const sw = 340;
  const sh = 540;
  const sx = Math.max(area.x + 12, Math.min(area.x + area.width - sw - 12, catBounds.x - sw - 16));
  const sy = Math.max(area.y + 12, Math.min(area.y + area.height - sh - 12, catBounds.y + catBounds.height - sh));

  settingsWindow = new BrowserWindow({
    width: sw,
    height: sh,
    x: sx,
    y: sy,
    title: '小黑猫桌宠 · 自定义设置',
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#13141a',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, '../src/settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function createWindow() {
  loadSettings();
  const winW = Math.round(BASE_W * currentSettings.scale);
  const winH = Math.round(BASE_H * currentSettings.scale);
  const def = getDefaultWindowPos(winW, winH);

  let initX = def.x;
  let initY = def.y;
  if (currentSettings.windowPos && typeof currentSettings.windowPos.x === 'number') {
    initX = Math.round(currentSettings.windowPos.x);
    initY = Math.round(currentSettings.windowPos.y);
  }

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: initX,
    y: initY,
    title: '',
    show: false,
    frame: false,
    transparent: true,
    thickFrame: false,
    focusable: false,
    backgroundColor: '#00000000',
    alwaysOnTop: currentSettings.alwaysOnTop,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    roundedCorners: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  if (currentSettings.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
  }
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.on('system-context-menu', (e) => e.preventDefault());
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  mainWindow.once('ready-to-show', () => {
    console.log('[BongoCat] Window ready-to-show at:', mainWindow.getBounds(), 'on display:', def.display.bounds);
    mainWindow.showInactive();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('window-resized', { width: winW, height: winH });
    mainWindow.webContents.send('settings-changed', currentSettings);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for click-through, dragging, sizing & live settings
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
});

ipcMain.on('move-window', (event, { dx, dy }) => {
  if (!mainWindow || mainWindow.isDestroyed() || currentSettings.lockPosition) return;
  const [x, y] = mainWindow.getPosition();
  const nx = Math.round(x + dx);
  const ny = Math.round(y + dy);
  mainWindow.setPosition(nx, ny);
  currentSettings.windowPos = { x: nx, y: ny };
  saveSettings();
});

ipcMain.handle('get-settings', () => currentSettings);

ipcMain.on('open-settings', () => openSettingsWindow());
ipcMain.on('reset-position', () => resetPetPosition());

ipcMain.on('update-settings', (event, partial) => {
  const prevScale = currentSettings.scale;
  const resetFlag = partial && partial.__resetDefaults;
  if (resetFlag) {
    currentSettings = { ...DEFAULT_SETTINGS, windowPos: currentSettings.windowPos };
  } else {
    currentSettings = { ...currentSettings, ...partial };
  }
  currentSettings.scale = Math.max(0.5, Math.min(1.8, Number(currentSettings.scale) || 1.0));
  saveSettings();

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (Math.abs(currentSettings.scale - prevScale) > 0.001) {
      const oldBounds = mainWindow.getBounds();
      const newW = Math.round(BASE_W * currentSettings.scale);
      const newH = Math.round(BASE_H * currentSettings.scale);
      // Anchor smoothly at bottom-right so scaling keeps the pet planted on the desk edge!
      const newX = oldBounds.x + (oldBounds.width - newW);
      const newY = oldBounds.y + (oldBounds.height - newH);
      mainWindow.setBounds({ x: newX, y: newY, width: newW, height: newH });
      currentSettings.windowPos = { x: newX, y: newY };
      saveSettings();
      mainWindow.webContents.send('window-resized', { width: newW, height: newH });
    }
    mainWindow.setAlwaysOnTop(Boolean(currentSettings.alwaysOnTop), 'pop-up-menu');
    mainWindow.webContents.send('settings-changed', currentSettings);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('settings-changed', currentSettings);
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});

function setupGlobalHooks() {
  function sendMousePos(screenX, screenY) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const bounds = mainWindow.getBounds();
    const curDisplay = screen.getDisplayNearestPoint({ x: screenX, y: screenY }) || screen.getPrimaryDisplay();
    const db = curDisplay.bounds;

    // Proportional head-center calculation works identically at any scale (0.5x ~ 1.8x)!
    const catHeadScreenX = bounds.x + Math.round(bounds.width * 0.50);
    const catHeadScreenY = bounds.y + Math.round(bounds.height * 0.38);
    const relX = Math.max(-1, Math.min(1, (screenX - catHeadScreenX) / (db.width * 0.30)));
    const relY = Math.max(-1, Math.min(1, (screenY - catHeadScreenY) / (db.height * 0.32)));

    const normX = Math.max(0, Math.min(1, (screenX - db.x) / db.width));
    const normY = Math.max(0, Math.min(1, (screenY - db.y) / db.height));

    mainWindow.webContents.send('global-mouse-move', {
      screenX,
      screenY,
      winX: screenX - bounds.x,
      winY: screenY - bounds.y,
      normX,
      normY,
      relX,
      relY
    });
  }

  // Fallback poll at 60fps
  setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const pt = screen.getCursorScreenPoint();
    sendMousePos(pt.x, pt.y);
  }, 16);

  if (!uIOhook) return;

  uIOhook.on('mousemove', (e) => {
    sendMousePos(e.x, e.y);
  });

  const pressedKeys = new Set();
  const isAltKey = (kc) => kc === 56 || kc === 3640;

  uIOhook.on('keydown', (e) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (isAltKey(e.keycode)) {
      mainWindow.webContents.send('alt-state', true);
    }
    const mapped = KEYCODE_MAP[e.keycode] || {
      label: String.fromCharCode(e.keycode).toUpperCase() || '?',
      id: `Key_${e.keycode}`
    };
    const isRepeat = pressedKeys.has(e.keycode);
    pressedKeys.add(e.keycode);

    mainWindow.webContents.send('global-key-down', {
      keycode: e.keycode,
      label: mapped.label,
      id: mapped.id,
      isSpace: Boolean(mapped.isSpace),
      isCaps: Boolean(mapped.isCaps),
      isRepeat
    });
  });

  uIOhook.on('keyup', (e) => {
    pressedKeys.delete(e.keycode);
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (isAltKey(e.keycode)) {
      mainWindow.webContents.send('alt-state', pressedKeys.has(56) || pressedKeys.has(3640));
    }
    const mapped = KEYCODE_MAP[e.keycode] || {
      label: '?',
      id: `Key_${e.keycode}`
    };
    mainWindow.webContents.send('global-key-up', {
      keycode: e.keycode,
      label: mapped.label,
      id: mapped.id
    });
  });

  uIOhook.on('mousedown', (e) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    // e.button: 1 = left, 2 = right, 3 = middle
    mainWindow.webContents.send('global-mouse-down', {
      button: e.button
    });
  });

  uIOhook.on('mouseup', (e) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('global-mouse-up', {
      button: e.button
    });
  });

  try {
    uIOhook.start();
  } catch (err) {
    console.error('Failed to start uIOhook:', err);
  }
}

if (gotLock) {
  app.whenReady().then(() => {
    createWindow();
    createTray();
    setupGlobalHooks();
  });
}

app.on('will-quit', () => {
  if (uIOhook) {
    try {
      uIOhook.stop();
    } catch (_) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
