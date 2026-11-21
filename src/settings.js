const scaleSlider = document.getElementById('scale-slider');
const scaleLabel = document.getElementById('scale-label');

let localCfg = {};

function renderUI(cfg) {
  localCfg = cfg || {};
  const pct = Math.round((localCfg.scale || 1) * 100);
  scaleSlider.value = pct;
  scaleLabel.textContent = `${pct}%`;

  document.querySelectorAll('[data-scale]').forEach((btn) => {
    btn.classList.toggle('active', Math.abs(Number(btn.dataset.scale) - (localCfg.scale || 1)) < 0.03);
  });

  const markGroup = (id, val) => {
    document.querySelectorAll(`#${id} .swatch`).forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.val === val);
    });
  };
  markGroup('kb-themes', localCfg.keyboardTheme || 'classic');
  markGroup('mouse-colors', localCfg.mouseColor || 'white');
  markGroup('cat-coats', localCfg.catCoat || 'black');
  markGroup('eye-colors', localCfg.eyeColor || 'lime');

  document.querySelectorAll('.switch[data-key]').forEach((sw) => {
    sw.classList.toggle('on', Boolean(localCfg[sw.dataset.key]));
  });
}

function pushUpdate(partial) {
  if (window.bongoAPI) {
    window.bongoAPI.updateSettings(partial);
  }
}

scaleSlider.addEventListener('input', () => {
  const pct = Number(scaleSlider.value);
  scaleLabel.textContent = `${pct}%`;
  pushUpdate({ scale: pct / 100 });
});

document.querySelectorAll('[data-scale]').forEach((btn) => {
  btn.addEventListener('click', () => pushUpdate({ scale: Number(btn.dataset.scale) }));
});

const bindSwatches = (containerId, key) => {
  document.querySelectorAll(`#${containerId} .swatch`).forEach((btn) => {
    btn.addEventListener('click', () => pushUpdate({ [key]: btn.dataset.val }));
  });
};
bindSwatches('kb-themes', 'keyboardTheme');
bindSwatches('mouse-colors', 'mouseColor');
bindSwatches('cat-coats', 'catCoat');
bindSwatches('eye-colors', 'eyeColor');

document.querySelectorAll('.switch[data-key]').forEach((sw) => {
  sw.addEventListener('click', () => {
    const key = sw.dataset.key;
    pushUpdate({ [key]: !localCfg[key] });
  });
});

document.getElementById('btn-reset-pos').addEventListener('click', () => {
  if (window.bongoAPI) window.bongoAPI.resetPosition();
});

document.getElementById('btn-reset-all').addEventListener('click', () => {
  pushUpdate({ __resetDefaults: true });
});

document.getElementById('btn-close').addEventListener('click', () => window.close());
document.getElementById('btn-done').addEventListener('click', () => window.close());

if (window.bongoAPI) {
  window.bongoAPI.getSettings().then(renderUI);
  window.bongoAPI.onSettingsChanged(renderUI);
}