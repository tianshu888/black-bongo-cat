const scaleSlider = document.getElementById('scale-slider');
const scaleLabel = document.getElementById('scale-label');
const toastEl = document.getElementById('toast');

let localCfg = {};
let localGame = {
  coins: 80,
  hunger: 84,
  mood: 86,
  energy: 92,
  affection: 0,
  inventory: { kibble: 1, churu: 1, can: 0, yarn: 0, wand: 0 },
  unlockedAccessories: ['none'],
  stats: { totalKeys: 0, totalClicks: 0, totalPets: 0, bugsCaught: 0, feedCount: 0 }
};

const SHOP_ITEMS = [
  { id: 'kibble', action: 'feedKibble', name: '🥛 脆脆猫粮', price: 20, desc: '饱食 +30 · 咔嚓点啄干粮碗' },
  { id: 'churu',  action: 'feedChuru',  name: '🥢 鲜香猫条', price: 50, desc: '饱食 +20 心情 +25 亲密 +15 · 伸舌头追舔' },
  { id: 'can',    action: 'feedCan',    name: '🥫 豪华罐头', price: 120, desc: '饱食 +60 心情 +40 亲密 +25 · 冒爱心盛宴' },
  { id: 'yarn',   action: 'playYarn',   name: '🧶 毛线球',   price: 40, desc: '心情 +25 亲密 +10 · 滚球互动玩耍' },
  { id: 'wand',   action: 'playWand',   name: '🎋 羽毛逗猫棒', price: 60, desc: '心情 +35 亲密 +20 · 挥舞逗猫赢奖励' }
];

const ACCESSORIES = [
  { id: 'none',       label: '无饰品',       levelReq: 1, price: 0 },
  { id: 'bell',       label: '🔔 金铃铛',   levelReq: 2, price: 80 },
  { id: 'bowtie',     label: '🎀 蝴蝶结',   levelReq: 3, price: 100 },
  { id: 'headphones', label: '🎧 小耳机',   levelReq: 4, price: 150 },
  { id: 'beret',      label: '🎨 贝雷帽',   levelReq: 5, price: 180 }
];

let toastTimer = null;
function showToast(msg, ok = true) {
  toastEl.textContent = msg;
  toastEl.style.background = ok ? 'rgba(22, 163, 74, 0.94)' : 'rgba(220, 38, 38, 0.92)';
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

function getBondLevel(affection) {
  return Math.max(1, Math.min(10, Math.floor(Math.sqrt((affection || 0) / 25)) + 1));
}

function getBondTitle(lv) {
  const titles = ['初识萌猫', '好奇搭档', '贴心小跟班', '粘人黑团子', '桌宠好伙伴', '猫猫知己', '呼噜大师', '灵魂猫伴', '摸鱼CEO', '殿堂级招财猫'];
  return titles[Math.min(titles.length - 1, lv - 1)];
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.toggle('active', p.id === `pane-${tabName}`));
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function renderGameUI(gs) {
  if (!gs) return;
  localGame = gs;
  document.getElementById('coins-display').textContent = `💰 ${Math.floor(gs.coins || 0)}`;

  const lv = getBondLevel(gs.affection || 0);
  const nextXp = (lv * lv) * 25;
  document.getElementById('bond-title').textContent = `💕 亲密 Lv.${lv} · ${getBondTitle(lv)}`;
  document.getElementById('affection-xp').textContent = `${Math.floor(gs.affection || 0)} / ${nextXp}`;

  const setBar = (id, val) => {
    const v = Math.max(0, Math.min(100, Math.round(val || 0)));
    document.getElementById(`bar-${id}`).style.width = `${v}%`;
    document.getElementById(`val-${id}`).textContent = `${v}`;
  };
  setBar('hunger', gs.hunger);
  setBar('mood', gs.mood);
  setBar('energy', gs.energy);

  const st = gs.stats || {};
  document.getElementById('mini-stats').textContent =
    `打字 ${st.totalKeys || 0} · 点击 ${st.totalClicks || 0} · 撸猫 ${st.totalPets || 0} · 抓虫 ${st.bugsCaught || 0}`;

  const shopList = document.getElementById('shop-list');
  shopList.innerHTML = '';
  const inv = gs.inventory || {};

  SHOP_ITEMS.forEach((item) => {
    const count = inv[item.id] || 0;
    const row = document.createElement('div');
    row.className = 'item-card';
    row.innerHTML = `
      <div class="item-info">
        <div class="item-title">${item.name} <span style="color:#a3e635;font-size:11px;font-weight:500;">(库存 ${count})</span></div>
        <div class="item-desc">${item.desc}</div>
      </div>
      <div class="item-actions">
        <button class="btn-sm buy" ${(gs.coins || 0) < item.price ? 'disabled' : ''}>${item.price} 币购</button>
        <button class="btn-sm use" ${count <= 0 ? 'disabled' : ''}>使用</button>
      </div>
    `;
    const [buyBtn, useBtn] = row.querySelectorAll('button');
    buyBtn.addEventListener('click', () => {
      if ((localGame.coins || 0) < item.price) return showToast('猫币不够啦，多打字赚点吧~', false);
      const nextInv = { ...(localGame.inventory || {}), [item.id]: (inv[item.id] || 0) + 1 };
      pushGameUpdate({ coins: localGame.coins - item.price, inventory: nextInv });
      showToast(`已购买 ${item.name}！`);
    });
    useBtn.addEventListener('click', () => {
      if ((inv[item.id] || 0) <= 0) return;
      const nextInv = { ...(localGame.inventory || {}), [item.id]: inv[item.id] - 1 };
      pushGameUpdate({ inventory: nextInv });
      if (window.bongoAPI) window.bongoAPI.triggerPlayAction({ type: item.action });
      showToast(`已递出 ${item.name}，快看小黑猫！`);
    });
    shopList.appendChild(row);
  });

  const accGrid = document.getElementById('accessory-list');
  accGrid.innerHTML = '';
  const unlocked = new Set(gs.unlockedAccessories || ['none']);
  ACCESSORIES.forEach((acc) => {
    const isUnlocked = unlocked.has(acc.id) || lv >= acc.levelReq;
    const isEquipped = (localCfg.equippedAccessory || 'none') === acc.id;
    const btn = document.createElement('button');
    btn.className = `pill-btn ${isEquipped ? 'active' : ''}`;
    if (isUnlocked) {
      btn.textContent = isEquipped ? `✓ ${acc.label}` : acc.label;
      btn.addEventListener('click', () => {
        pushUpdate({ equippedAccessory: acc.id });
        showToast(acc.id === 'none' ? '已摘下饰品' : `已戴上 ${acc.label}！`);
      });
    } else {
      btn.textContent = `${acc.label} (Lv.${acc.levelReq}或${acc.price}币)`;
      btn.addEventListener('click', () => {
        if ((localGame.coins || 0) < acc.price) {
          return showToast(`需亲密 Lv.${acc.levelReq} 或 ${acc.price} 猫币解锁~`, false);
        }
        const nextSet = Array.from(new Set([...unlocked, acc.id]));
        pushGameUpdate({ coins: localGame.coins - acc.price, unlockedAccessories: nextSet });
        pushUpdate({ equippedAccessory: acc.id });
        showToast(`解锁并戴上 ${acc.label}！`);
      });
    }
    accGrid.appendChild(btn);
  });
}

function renderSettingsUI(cfg) {
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
  renderGameUI(localGame);
}

function pushUpdate(partial) {
  if (window.bongoAPI) window.bongoAPI.updateSettings(partial);
}

function pushGameUpdate(partial) {
  if (window.bongoAPI) window.bongoAPI.updateGameState(partial);
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

document.querySelectorAll('[data-demo]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (window.bongoAPI) window.bongoAPI.triggerPlayAction({ type: btn.dataset.demo });
    showToast('已触发动作演示~');
  });
});

document.getElementById('btn-reset-pos').addEventListener('click', () => {
  if (window.bongoAPI) window.bongoAPI.resetPosition();
});

document.getElementById('btn-reset-all').addEventListener('click', () => {
  pushUpdate({ __resetDefaults: true });
  showToast('已恢复默认外观设置');
});

document.getElementById('btn-close').addEventListener('click', () => window.close());
document.getElementById('btn-done').addEventListener('click', () => window.close());

renderGameUI(localGame);
if (window.bongoAPI) {
  window.bongoAPI.getSettings().then(renderSettingsUI);
  window.bongoAPI.getGameState().then(renderGameUI);
  window.bongoAPI.onSettingsChanged(renderSettingsUI);
  window.bongoAPI.onGameStateChanged(renderGameUI);
  window.bongoAPI.onSwitchTab((tab) => switchTab(tab));
}