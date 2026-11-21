import { getCareerInfo } from './careers.js';

const scaleSlider = document.getElementById('scale-slider');
const scaleLabel = document.getElementById('scale-label');
const toastEl = document.getElementById('toast');
const catNameInput = document.getElementById('cat-name-input');
const titleCatName = document.getElementById('title-cat-name');

let localCfg = {};
let localGame = {
  catName: '打工喵',
  coins: 80,
  hunger: 84,
  mood: 86,
  energy: 92,
  affection: 0,
  workXp: 0,
  isExhausted: false,
  inventory: { kibble: 1, churu: 1, can: 0, yarn: 0, wand: 0 },
  unlockedAccessories: ['none'],
  stats: { totalKeys: 0, totalClicks: 0, totalPets: 0, bugsCaught: 0, feedCount: 0 }
};

const SHOP_ITEMS = [
  { id: 'kibble', action: 'feedKibble', name: '🥛 脆脆猫粮', price: 20, desc: '饱食 +35 体力 +35 心情 +6 · 快速填肚回体' },
  { id: 'churu',  action: 'feedChuru',  name: '🥢 鲜香猫条', price: 50, desc: '饱食 +25 体力 +45 心情 +28 亲密 +18 · 舔食快速醒神' },
  { id: 'can',    action: 'feedCan',    name: '🥫 豪华罐头', price: 120, desc: '饱食 +75 体力 +100 心情 +45 亲密 +30 · 满血秒回元气' },
  { id: 'yarn',   action: 'playYarn',   name: '🧶 毛线球',   price: 40, desc: '心情 +25 亲密 +10 体力 -6 · 滚球互动玩耍' },
  { id: 'wand',   action: 'playWand',   name: '🎋 羽毛逗猫棒', price: 60, desc: '心情 +35 亲密 +20 体力 -8 · 挥舞逗猫赢 +20 币' }
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
  const catName = gs.catName || '打工喵';
  titleCatName.textContent = catName;
  if (document.activeElement !== catNameInput) {
    catNameInput.value = catName;
  }

  document.getElementById('coins-display').textContent = `💰 ${Math.floor(gs.coins || 0)}`;
  document.getElementById('exhausted-badge').classList.toggle('show', Boolean(gs.isExhausted));

  const xp = Math.floor(gs.workXp || 0);
  const { current: career, next: nextCareer, progress } = getCareerInfo(xp);
  document.getElementById('career-title').textContent = `💼 Lv.${career.level} · ${career.title}`;
  document.getElementById('career-xp').textContent = nextCareer
    ? `${xp} / ${nextCareer.minXp} XP`
    : `${xp} · 满级`;
  document.getElementById('bar-career').style.width = `${Math.round(progress * 100)}%`;
  document.getElementById('career-perk').textContent =
    `工作 +${career.baseCoin}币/次 · 暴击 ${Math.round(career.critChance * 100)}%(+${career.critBonus}) · 耗体 ${Math.round(career.staminaCostMult * 100)}%`;

  const lv = getBondLevel(gs.affection || 0);
  const nextXp = (lv * lv) * 25;
  document.getElementById('bond-title').textContent = `💕 亲密 Lv.${lv} · ${getBondTitle(lv)}`;
  document.getElementById('affection-xp').textContent = `${Math.floor(gs.affection || 0)} / ${nextXp} 亲密`;

  const setBar = (id, val) => {
    const v = Math.max(0, Math.min(100, Math.round(val || 0)));
    document.getElementById(`bar-${id}`).style.width = `${v}%`;
    document.getElementById(`val-${id}`).textContent = `${v}`;
  };
  setBar('hunger', gs.hunger);
  setBar('mood', gs.mood);
  setBar('energy', gs.energy);
  const energyFill = document.getElementById('bar-energy');
  energyFill.style.background = (gs.isExhausted || (gs.energy || 0) <= 15) ? '#ef4444' : '#38bdf8';

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
      const isFood = item.id === 'kibble' || item.id === 'churu' || item.id === 'can';
      pushGameUpdate(isFood ? { inventory: nextInv, isExhausted: false } : { inventory: nextInv });
      if (window.bongoAPI) window.bongoAPI.triggerPlayAction({ type: item.action });
      showToast(`已递出 ${item.name}，快看${localGame.catName || '打工喵'}！`);
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

function saveCatName() {
  const clean = (catNameInput.value || '').trim().slice(0, 10) || '打工喵';
  catNameInput.value = clean;
  pushGameUpdate({ catName: clean });
  showToast(`已改名为「${clean}」！`);
}

document.getElementById('btn-save-name').addEventListener('click', saveCatName);
catNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    catNameInput.blur();
    saveCatName();
  }
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