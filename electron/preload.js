const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bongoAPI', {
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),
  quitApp: () => ipcRenderer.send('quit-app'),
  openSettings: (tab) => ipcRenderer.send('open-settings', tab),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial) => ipcRenderer.send('update-settings', partial),
  resetPosition: () => ipcRenderer.send('reset-position'),
  getGameState: () => ipcRenderer.invoke('get-game-state'),
  updateGameState: (partial) => ipcRenderer.send('update-game-state', partial),
  triggerPlayAction: (action) => ipcRenderer.send('trigger-play-action', action),
  onSettingsChanged: (cb) => ipcRenderer.on('settings-changed', (_, cfg) => cb(cfg)),
  onGameStateChanged: (cb) => ipcRenderer.on('game-state-changed', (_, gs) => cb(gs)),
  onPlayAction: (cb) => ipcRenderer.on('play-action', (_, action) => cb(action)),
  onSwitchTab: (cb) => ipcRenderer.on('switch-tab', (_, tab) => cb(tab)),
  onWindowResized: (cb) => ipcRenderer.on('window-resized', (_, dims) => cb(dims)),
  onAltState: (cb) => ipcRenderer.on('alt-state', (_, down) => cb(down)),
  onTriggerDemo: (cb) => ipcRenderer.on('trigger-demo', () => cb()),
  onGlobalMouseMove: (cb) => ipcRenderer.on('global-mouse-move', (_, data) => cb(data)),
  onGlobalKeyDown: (cb) => ipcRenderer.on('global-key-down', (_, data) => cb(data)),
  onGlobalKeyUp: (cb) => ipcRenderer.on('global-key-up', (_, data) => cb(data)),
  onGlobalMouseDown: (cb) => ipcRenderer.on('global-mouse-down', (_, data) => cb(data)),
  onGlobalMouseUp: (cb) => ipcRenderer.on('global-mouse-up', (_, data) => cb(data))
});
