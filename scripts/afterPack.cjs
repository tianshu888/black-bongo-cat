const fs = require('fs');
const path = require('path');

/**
 * Strips ~47 MB of unused Chromium locale .pak files & license HTML from win-unpacked
 * before portable/NSIS packaging so portable decompression & disk I/O are noticeably faster.
 */
exports.default = async function afterPack(context) {
  const outDir = context.appOutDir;
  const localesDir = path.join(outDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const keep = new Set(['zh-CN.pak', 'en-US.pak']);
    for (const name of fs.readdirSync(localesDir)) {
      if (!keep.has(name)) {
        fs.rmSync(path.join(localesDir, name), { force: true });
      }
    }
  }
  const lic = path.join(outDir, 'LICENSES.chromium.html');
  if (fs.existsSync(lic)) {
    fs.rmSync(lic, { force: true });
  }
};
