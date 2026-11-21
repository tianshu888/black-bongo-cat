import {
  SHOP_ITEMS,
  ACCESSORIES,
  getCareerInfo,
  getBadgeTier,
  formatOwnerCall
} from './careers.js';

const scaleSlider = document.getElementById('scale-slider');
const scaleLabel = document.getElementById('scale-label');
const toastEl = document.getElementById('toast');
const catNameInput = document.getElementById('cat-name-input');
const titleCatName = document.getElementById('title-cat-name');
const miniBadge = document.getElementById('mini-badge');
const miniBadgePhoto = document.getElementById('mini-badge-photo');

let localCfg = {};
let badgePhotoUrl = '';
let localGame = {
  onboarded: false,
  employeeId: 'MC-0001',
  catName: '打工喵',
  department: '千川剪辑部',
  ownerName: '',
  ownerCall: '铲屎官',
  skills: ['会翻跟斗', '会抓虫子'],
  hobbies: ['钻快递纸箱', '趴热键盘睡觉'],
  badgeTheme: 'blue',
  coins: 120,
  hunger: 84,
  mood: 86,
  energy: 92,
  affection: 0,
  workXp: 0,
  isExhausted: false,
  inventory: { kibble: 2, churu: 1, can: 0, yarn: 0, wand: 0 },
  unlockedAccessories: ['none'],
  stats: { totalKeys: 0, totalClicks: 0, totalPets: 0, bugsCaught: 0, feedCount: 0 }
};

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

function renderMiniBadgePhoto() {
  if (badgePhotoUrl) {
    miniBadgePhoto.innerHTML = `<img src="${badgePhotoUrl}" alt="工牌照" />`;
    return;
  }
  const coatMap = { black: '#18181b', blue: '#475569', cream: '#f1f5f9', orange: '#ea580c' };
  const eyeMap = { lime: '#a3e635', amber: '#fbbf24', sky: '#38bdf8', pink: '#f472b6', violet: '#a78bfa' };
  const fur = coatMap[localCfg.catCoat] || '#18181b';
  const iris = eyeMap[localCfg.eyeColor] || '#a3e635';
  miniBadgePhoto.innerHTML = `
    <svg viewBox="0 0 80 80" width="46" height="46">
      <circle cx="40" cy="44" r="24" fill="${fur}"/>
      <polygon points="18,30 22,12 34,24" fill="${fur}"/>
      <polygon points="62,30 58,12 46,24" fill="${fur}"/>
      <ellipse cx="32" cy="44" rx="5.5" ry="6.5" fill="${iris}"/>
      <ellipse cx="48" cy="44" rx="5.5" ry="6.5" fill="${iris}"/>
      <ellipse cx="32" cy="44" rx="2" ry="4.5" fill="#09090b"/>
      <ellipse cx="48" cy="44" rx="2" ry="4.5" fill="#09090b"/>
    </svg>`;
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
  const tier = getBadgeTier(career.level);

  miniBadge.style.borderColor = tier.border;
  miniBadge.style.background = tier.bg;
  const tierChip = document.getElementById('badge-tier-chip');
  tierChip.textContent = tier.label;
  tierChip.style.color = tier.badgeColor;
  document.getElementById('badge-dept-id').textContent = gs.department || '千川剪辑部';
  document.getElementById('badge-owner-line').textContent = `${gs.employeeId || 'MC-0001'} · 专属${formatOwnerCall(gs)}`;
  const traitText = [...(gs.skills || []), ...(gs.hobbies || [])].slice(0, 4).join(' · ') || '点击右侧录入技能与爱好';
  document.getElementById('badge-traits-line').textContent = traitText;
  renderMiniBadgePhoto();

  document.getElementById('career-title').textContent = `💼 Lv.${career.level} · ${career.title}`;
  document.getElementById('career-xp').textContent = nextCareer
    ? `${xp} / ${nextCareer.minXp} XP`
    : `${xp} · 满级BOSS`;
  document.getElementById('bar-career').style.width = `${Math.round(progress * 100)}%`;
  document.getElementById('career-tagline').textContent = career.tagline || '';
  document.getElementById('career-perk').textContent =
    `工作 +${career.baseCoin}币/次 · 爆单 ${Math.round(career.critChance * 100)}%(+${career.critBonus}) · 耗体 ${Math.round(career.staminaCostMult * 100)}%`;

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
      showToast(`已递出 ${item.name}，${formatOwnerCall(localGame)}真好~`);
    });
    shopList.appendChild(row);
  });

  const accGrid = document.getElementById('accessory-list');
  accGrid.innerHTML = '';
  const unlocked = new Set(gs.unlockedAccessories || ['none']);
  ACCESSORIES.forEach((acc) => {
    const isUnlocked = unlocked.has(acc.id) || Math.max(lv, career.level) >= acc.levelReq;
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
          return showToast(`需职级/亲密 Lv.${acc.levelReq} 或 ${acc.price} 猫币解锁~`, false);
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

document.getElementById('btn-open-onboarding').addEventListener('click', () => {
  if (window.bongoAPI && window.bongoAPI.openOnboarding) window.bongoAPI.openOnboarding();
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
  if (window.bongoAPI.getBadgePhoto) {
    window.bongoAPI.getBadgePhoto().then((url) => {
      if (url) {
        badgePhotoUrl = url;
        renderMiniBadgePhoto();
      }
    });
  }
  if (window.bongoAPI.onBadgePhotoChanged) {
    window.bongoAPI.onBadgePhotoChanged((url) => {
      badgePhotoUrl = url || '';
      renderMiniBadgePhoto();
    });
  }
  window.bongoAPI.onSettingsChanged(renderSettingsUI);
  window.bongoAPI.onGameStateChanged(renderGameUI);
  window.bongoAPI.onSwitchTab((tab) => switchTab(tab));
}
