/**
 * Synchronous in-process Win32 frameless window hardening via koffi.
 * Eliminates Windows 10/11 non-client caption strip repaints without spawning powershell.exe.
 */
let win32Api = null;

function ensureWin32Api() {
  if (win32Api !== null) return win32Api;
  if (process.platform !== 'win32') {
    win32Api = false;
    return false;
  }
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    const dwmapi = koffi.load('dwmapi.dll');
    const WndProcProto = koffi.proto('intptr __stdcall WndProc(uintptr hWnd, uint32 msg, uintptr wParam, intptr lParam)');
    win32Api = {
      koffi,
      WndProcProto,
      GetWindowLongW: user32.func('uint32 __stdcall GetWindowLongW(uintptr hWnd, int32 nIndex)'),
      SetWindowLongW: user32.func('uint32 __stdcall SetWindowLongW(uintptr hWnd, int32 nIndex, uint32 dwNewLong)'),
      SetWindowLongPtrW: user32.func('uintptr __stdcall SetWindowLongPtrW(uintptr hWnd, int32 nIndex, uintptr dwNewLong)'),
      CallWindowProcW: user32.func('intptr __stdcall CallWindowProcW(uintptr prev, uintptr hWnd, uint32 msg, uintptr wParam, intptr lParam)'),
      SetWindowPos: user32.func('bool __stdcall SetWindowPos(uintptr hWnd, uintptr after, int32 x, int32 y, int32 cx, int32 cy, uint32 flags)'),
      DwmSetWindowAttribute: dwmapi.func('int32 __stdcall DwmSetWindowAttribute(uintptr hwnd, uint32 attr, _In_ uint32 *val, uint32 size)'),
      DwmExtendFrameIntoClientArea: dwmapi.func('int32 __stdcall DwmExtendFrameIntoClientArea(uintptr hwnd, _In_ int32 *margins)')
    };
  } catch (err) {
    console.warn('[BongoCat] win32Frameless init skipped:', err.message);
    win32Api = false;
  }
  return win32Api;
}

const activeHooks = new WeakMap();

function getHwndNumber(win) {
  const buf = win.getNativeWindowHandle();
  return buf.length === 8 ? Number(buf.readBigUInt64LE(0)) : buf.readUInt32LE(0);
}

function stripStylesAndDwm(api, hwnd) {
  const st = api.GetWindowLongW(hwnd, -16);
  const targetSt = ((st & ~0x00CF0000) | 0x80000000) >>> 0;
  if (st !== targetSt) api.SetWindowLongW(hwnd, -16, targetSt);

  const ex = api.GetWindowLongW(hwnd, -20);
  const targetEx = ((ex & ~0x00020301) | 0x08000080) >>> 0;
  if (ex !== targetEx) api.SetWindowLongW(hwnd, -20, targetEx);

  api.DwmSetWindowAttribute(hwnd, 2, [1], 4);          // DWMWA_NCRENDERING_POLICY = DWMNCRP_DISABLED
  api.DwmSetWindowAttribute(hwnd, 33, [1], 4);         // DWMWA_WINDOW_CORNER_PREFERENCE = DWMWCP_DONOTROUND (Win11)
  api.DwmSetWindowAttribute(hwnd, 34, [0xFFFFFFFE], 4); // DWMWA_BORDER_COLOR = DWMWA_COLOR_NONE (Win11)
  api.DwmExtendFrameIntoClientArea(hwnd, [0, 0, 0, 0]);
  api.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0037);       // SWP_NOSIZE|NOMOVE|NOZORDER|NOACTIVATE|FRAMECHANGED
}

function installFramelessWin32Hook(win) {
  const api = ensureWin32Api();
  if (!api || !win || win.isDestroyed()) return;
  if (activeHooks.has(win)) {
    stripStylesAndDwm(api, activeHooks.get(win).hwnd);
    return;
  }

  try {
    const hwnd = getHwndNumber(win);
    stripStylesAndDwm(api, hwnd);

    const state = { hwnd, prevProc: 0, cb: null };
    state.cb = api.koffi.register((hWnd, msg, wParam, lParam) => {
      if (msg === 0x0083) return 0; // WM_NCCALCSIZE: 0px non-client area
      if (msg === 0x0085) return 0; // WM_NCPAINT: block OS frame/caption painting
      if (msg === 0x0086) return 1; // WM_NCACTIVATE: block active/inactive title strip repaint
      const res = api.CallWindowProcW(state.prevProc, hWnd, msg, wParam, lParam);
      if (msg === 0x007D || msg === 0x031E || msg === 0x02E0) {
        // WM_STYLECHANGED / WM_DWMCOMPOSITIONCHANGED / WM_DPICHANGED
        const st = api.GetWindowLongW(hWnd, -16);
        if ((st & 0x00CF0000) !== 0 || (st & 0x80000000) === 0) {
          api.SetWindowLongW(hWnd, -16, ((st & ~0x00CF0000) | 0x80000000) >>> 0);
        }
        api.DwmSetWindowAttribute(hWnd, 2, [1], 4);
        api.DwmSetWindowAttribute(hWnd, 34, [0xFFFFFFFE], 4);
      }
      return res;
    }, api.koffi.pointer(api.WndProcProto));

    state.prevProc = api.SetWindowLongPtrW(hwnd, -4, api.koffi.address(state.cb));
    activeHooks.set(win, state);

    win.once('closed', () => {
      const rec = activeHooks.get(win);
      if (!rec) return;
      activeHooks.delete(win);
      try {
        if (rec.prevProc) api.SetWindowLongPtrW(rec.hwnd, -4, rec.prevProc);
        if (rec.cb) api.koffi.unregister(rec.cb);
      } catch (_) {}
    });
  } catch (err) {
    console.warn('[BongoCat] installFramelessWin32Hook failed:', err.message);
  }
}

function reapplyFramelessWin32(win) {
  const api = ensureWin32Api();
  if (!api || !win || win.isDestroyed()) return;
  try {
    const rec = activeHooks.get(win);
    stripStylesAndDwm(api, rec ? rec.hwnd : getHwndNumber(win));
  } catch (_) {}
}

module.exports = { installFramelessWin32Hook, reapplyFramelessWin32 };
