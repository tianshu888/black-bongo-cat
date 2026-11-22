/**
 * Synchronous in-process Win32 frameless window hardening via koffi (direct Win32 calls only).
 * Avoids GWLP_WNDPROC JS callbacks to eliminate Chromium message-pump re-entrancy crashes,
 * while using Electron's safe hookWindowMessage + fast direct SetWindowLongW/DwmSetWindowAttribute.
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
    win32Api = {
      GetWindowLongW: user32.func('uint32 __stdcall GetWindowLongW(uintptr hWnd, int32 nIndex)'),
      SetWindowLongW: user32.func('uint32 __stdcall SetWindowLongW(uintptr hWnd, int32 nIndex, uint32 dwNewLong)'),
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

const hookedWindows = new WeakSet();

function getHwndNumber(win) {
  const buf = win.getNativeWindowHandle();
  return buf.length === 8 ? Number(buf.readBigUInt64LE(0)) : buf.readUInt32LE(0);
}

function stripStylesAndDwm(api, hwnd, forceFrameChanged = false) {
  const st = api.GetWindowLongW(hwnd, -16);
  const targetSt = ((st & ~0x00CF0000) | 0x80000000) >>> 0;
  let styleChanged = false;
  if (st !== targetSt) {
    api.SetWindowLongW(hwnd, -16, targetSt);
    styleChanged = true;
  }

  const ex = api.GetWindowLongW(hwnd, -20);
  const targetEx = ((ex & ~0x00020301) | 0x08000080) >>> 0;
  if (ex !== targetEx) {
    api.SetWindowLongW(hwnd, -20, targetEx);
    styleChanged = true;
  }

  api.DwmSetWindowAttribute(hwnd, 2, [1], 4);          // DWMWA_NCRENDERING_POLICY = DWMNCRP_DISABLED
  api.DwmSetWindowAttribute(hwnd, 33, [1], 4);         // DWMWA_WINDOW_CORNER_PREFERENCE = DWMWCP_DONOTROUND (Win11)
  api.DwmSetWindowAttribute(hwnd, 34, [0xFFFFFFFE], 4); // DWMWA_BORDER_COLOR = DWMWA_COLOR_NONE (Win11)
  api.DwmExtendFrameIntoClientArea(hwnd, [0, 0, 0, 0]);

  if (styleChanged || forceFrameChanged) {
    api.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0037);     // SWP_NOSIZE|NOMOVE|NOZORDER|NOACTIVATE|FRAMECHANGED
  }
}

function installFramelessWin32Hook(win) {
  const api = ensureWin32Api();
  if (!api || !win || win.isDestroyed()) return;

  try {
    const hwnd = getHwndNumber(win);
    stripStylesAndDwm(api, hwnd, true);

    if (hookedWindows.has(win)) return;
    hookedWindows.add(win);

    if (typeof win.hookWindowMessage === 'function') {
      // Safe Electron native message hooks: only re-apply when style/DWM/DPI actually changes
      const safeReapply = (force = false) => {
        if (!win || win.isDestroyed()) return;
        try {
          stripStylesAndDwm(api, getHwndNumber(win), force);
        } catch (_) {}
      };
      win.hookWindowMessage(0x007D, () => safeReapply(false)); // WM_STYLECHANGED
      win.hookWindowMessage(0x0086, () => safeReapply(false)); // WM_NCACTIVATE
      win.hookWindowMessage(0x031E, () => safeReapply(true));  // WM_DWMCOMPOSITIONCHANGED
      win.hookWindowMessage(0x02E0, () => safeReapply(true));  // WM_DPICHANGED
    }
  } catch (err) {
    console.warn('[BongoCat] installFramelessWin32Hook failed:', err.message);
  }
}

function reapplyFramelessWin32(win) {
  const api = ensureWin32Api();
  if (!api || !win || win.isDestroyed()) return;
  try {
    stripStylesAndDwm(api, getHwndNumber(win), false);
  } catch (_) {}
}

module.exports = { installFramelessWin32Hook, reapplyFramelessWin32 };
