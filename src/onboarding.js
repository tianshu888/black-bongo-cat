import {
  OWNER_CALL_PRESETS,
  DEPARTMENTS,
  SKILL_PRESETS,
  HOBBY_PRESETS,
  RANDOM_CAT_NAMES,
  getCareerInfo,
  getBadgeTier
} from './careers.js';

const ownerNameEl = document.getElementById('owner-name');
const ownerCallEl = document.getElementById('owner-call');
const catNameEl = document.getElementById('cat-name');
const customSkillEl = document.getElementById('custom-skill');
const customHobbyEl = document.getElementById('custom-hobby');
const photoBox = document.getElementById('photo-box');
const badgeCard = document.getElementById('badge-card');
const pawStamp = document.getElementById('paw-stamp');
const submitBtn = document.getElementById('btn-submit');
const skipBtn = document.getElementById('btn-skip');

let currentCfg = { catCoat: 'black', eyeColor: 'lime' };
let currentGs = {
  onboarded: false,
  employeeId: 'MC-0001',
  catName: '打工喵',
  department: '千川剪辑部',
  ownerName: '',
  ownerCall: '铲屎官',
  skills: ['会翻跟斗', '会抓虫子'],
  hobbies: ['钻快递纸箱', '趴热键盘睡觉'],
  badgeTheme: 'blue',
  workXp: 0,
  hiredAt: ''
};
let selectedPose = 'normal';
let badgePhotoUrl = '';

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderPhoto() {
  if (badgePhotoUrl) {
    photoBox.innerHTML = `<img src="${badgePhotoUrl}" alt="工牌照" />`;
    return;
  }
  const coatMap = {
    black: '#18181b',
    blue: '#475569',
    cream: '#f1f5f9',
    orange: '#ea580c'
  };
  const eyeMap = {
    lime: '#a3e635',
    amber: '#fbbf24',
    sky: '#38bdf8',
    pink: '#f472b6',
    violet: '#a78bfa'
  };
  const fur = coatMap[currentCfg.catCoat] || '#18181b';
  const iris = eyeMap[currentCfg.eyeColor] || '#a3e635';
  photoBox.innerHTML = `
    <svg viewBox="0 0 80 80" width="76" height="76">
      <circle cx="40" cy="44" r="24" fill="${fur}"/>
      <polygon points="18,30 22,12 34,24" fill="${fur}"/>
      <polygon points="62,30 58,12 46,24" fill="${fur}"/>
      <ellipse cx="32" cy="44" rx="5.5" ry="6.5" fill="${iris}"/>
      <ellipse cx="48" cy="44" rx="5.5" ry="6.5" fill="${iris}"/>
      <ellipse cx="32" cy="44" rx="2" ry="4.5" fill="#09090b"/>
      <ellipse cx="48" cy="44" rx="2" ry="4.5" fill="#09090b"/>
    </svg>`;
}

function renderPills(containerId, items, activeItems, onClick) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const merged = [...items];
  activeItems.forEach((v) => {
    if (!merged.includes(v)) merged.push(v);
  });
  merged.forEach((text) => {
    const btn = document.createElement('button');
    btn.className = `pill ${activeItems.includes(text) ? 'active' : ''}`;
    btn.textContent = text;
    btn.addEventListener('click', () => onClick(text));
    el.appendChild(btn);
  });
}

function renderBadgePreview() {
  const { current: career } = getCareerInfo(currentGs.workXp || 0);
  const tier = getBadgeTier(career.level);

  badgeCard.className = `badge-stage theme-${currentGs.badgeTheme || 'blue'}`;
  const tierEl = document.getElementById('badge-tier');
  tierEl.textContent = tier.label;
  tierEl.style.color = tier.badgeColor;

  document.getElementById('preview-name').textContent = (catNameEl.value || '').trim() || '打工喵';
  document.getElementById('preview-dept').textContent = `${currentGs.department || '千川剪辑部'} · ${currentGs.employeeId || 'MC-0001'}`;
  document.getElementById('preview-rank').textContent = `Lv.${career.level} ${career.title} (底薪 ${career.baseCoin} 币/次)`;
  document.getElementById('preview-date').textContent = `入职：${currentGs.hiredAt || todayStr()}`;

  const sk = currentGs.skills && currentGs.skills.length ? currentGs.skills.join(' · ') : '暂无填报（全靠摸鱼）';
  const hb = currentGs.hobbies && currentGs.hobbies.length ? currentGs.hobbies.join(' · ') : '发呆看铲屎官干活';
  document.getElementById('preview-skills').textContent = sk;
  document.getElementById('preview-hobbies').textContent = hb;

  const call = (ownerCallEl.value || '').trim() || '铲屎官';
  const name = (ownerNameEl.value || '').trim();
  document.getElementById('preview-owner').textContent = name ? `专属${call}：${name}` : `专属${call}`;

  document.querySelectorAll('#theme-swatches .swatch').forEach((s) => {
    s.classList.toggle('active', s.dataset.val === (currentGs.badgeTheme || 'blue'));
  });
  renderPhoto();
}

function renderForm() {
  if (document.activeElement !== ownerNameEl) ownerNameEl.value = currentGs.ownerName || '';
  if (document.activeElement !== ownerCallEl) ownerCallEl.value = currentGs.ownerCall || '铲屎官';
  if (document.activeElement !== catNameEl) catNameEl.value = currentGs.catName || '打工喵';

  const refreshCallPills = () => {
    const activeCall = ownerCallEl.value.trim() || '铲屎官';
    renderPills('call-presets', OWNER_CALL_PRESETS, [activeCall], (val) => {
      currentGs.ownerCall = val;
      ownerCallEl.value = val;
      refreshCallPills();
      renderBadgePreview();
    });
  };
  refreshCallPills();

  const refreshDeptPills = () => {
    renderPills('dept-pills', DEPARTMENTS, [currentGs.department || DEPARTMENTS[0]], (val) => {
      currentGs.department = val;
      refreshDeptPills();
      renderBadgePreview();
    });
  };
  refreshDeptPills();

  const toggleMulti = (key, maxCount, val) => {
    const list = Array.isArray(currentGs[key]) ? [...currentGs[key]] : [];
    const idx = list.indexOf(val);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      if (list.length >= maxCount) list.shift();
      list.push(val);
    }
    currentGs[key] = list;
  };

  const refreshSkills = () => {
    renderPills('skill-presets', SKILL_PRESETS, currentGs.skills || [], (val) => {
      toggleMulti('skills', 4, val);
      refreshSkills();
      renderBadgePreview();
    });
  };
  refreshSkills();

  const refreshHobbies = () => {
    renderPills('hobby-presets', HOBBY_PRESETS, currentGs.hobbies || [], (val) => {
      toggleMulti('hobbies', 4, val);
      refreshHobbies();
      renderBadgePreview();
    });
  };
  refreshHobbies();

  document.querySelectorAll('#coat-swatches .swatch').forEach((s) => {
    s.classList.toggle('active', s.dataset.val === (currentCfg.catCoat || 'black'));
  });
  document.querySelectorAll('#eye-swatches .swatch').forEach((s) => {
    s.classList.toggle('active', s.dataset.val === (currentCfg.eyeColor || 'lime'));
  });

  if (currentGs.onboarded) {
    document.getElementById('mode-pill').textContent = '工牌编辑';
    document.getElementById('gift-note').textContent = '✨ 随时可更新猫名、主人称呼、技能爱好与重拍工牌照';
    skipBtn.textContent = '取消关闭';
    submitBtn.textContent = '💾 保存工牌资料';
  }
  renderBadgePreview();
}

[ownerNameEl, ownerCallEl, catNameEl].forEach((inp) => {
  inp.addEventListener('input', () => {
    currentGs.ownerName = ownerNameEl.value.trim();
    currentGs.ownerCall = ownerCallEl.value.trim() || '铲屎官';
    currentGs.catName = catNameEl.value.trim() || '打工喵';
    renderBadgePreview();
  });
});

document.getElementById('btn-rand-name').addEventListener('click', () => {
  const pool = RANDOM_CAT_NAMES.filter((n) => n !== catNameEl.value.trim());
  const pick = pool[Math.floor(Math.random() * pool.length)] || '黑煤球';
  catNameEl.value = pick;
  currentGs.catName = pick;
  renderBadgePreview();
});

function addCustomTag(inputEl, key, refreshFn) {
  const txt = (inputEl.value || '').trim().slice(0, 14);
  if (!txt) return;
  const list = Array.isArray(currentGs[key]) ? [...currentGs[key]] : [];
  if (!list.includes(txt)) {
    if (list.length >= 4) list.shift();
    list.push(txt);
    currentGs[key] = list;
  }
  inputEl.value = '';
  renderForm();
}

document.getElementById('btn-add-skill').addEventListener('click', () => addCustomTag(customSkillEl, 'skills'));
customSkillEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTag(customSkillEl, 'skills'); });
document.getElementById('btn-add-hobby').addEventListener('click', () => addCustomTag(customHobbyEl, 'hobbies'));
customHobbyEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTag(customHobbyEl, 'hobbies'); });

document.querySelectorAll('#coat-swatches .swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentCfg.catCoat = btn.dataset.val;
    if (window.bongoAPI) window.bongoAPI.updateSettings({ catCoat: currentCfg.catCoat });
    renderForm();
  });
});

document.querySelectorAll('#eye-swatches .swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentCfg.eyeColor = btn.dataset.val;
    if (window.bongoAPI) window.bongoAPI.updateSettings({ eyeColor: currentCfg.eyeColor });
    renderForm();
  });
});

document.querySelectorAll('#pose-pills .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedPose = btn.dataset.pose;
    document.querySelectorAll('#pose-pills .pill').forEach((p) => p.classList.toggle('active', p === btn));
  });
});

document.querySelectorAll('#theme-swatches .swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentGs.badgeTheme = btn.dataset.val;
    renderBadgePreview();
  });
});

document.getElementById('btn-capture-3d').addEventListener('click', async () => {
  if (!window.bongoAPI || !window.bongoAPI.captureCatPhoto) return;
  const dataUrl = await window.bongoAPI.captureCatPhoto({
    pose: selectedPose,
    theme: currentGs.badgeTheme || 'blue'
  });
  if (dataUrl) {
    badgePhotoUrl = dataUrl;
    renderPhoto();
  }
});

document.getElementById('btn-pick-local').addEventListener('click', async () => {
  if (!window.bongoAPI || !window.bongoAPI.pickLocalPhoto) return;
  const dataUrl = await window.bongoAPI.pickLocalPhoto();
  if (dataUrl) {
    badgePhotoUrl = dataUrl;
    renderPhoto();
  }
});

function commitOnboarding(isQuickSkip = false) {
  const payload = {
    onboarded: true,
    employeeId: currentGs.employeeId || 'MC-0001',
    catName: (catNameEl.value || '').trim() || '打工喵',
    ownerName: (ownerNameEl.value || '').trim(),
    ownerCall: (ownerCallEl.value || '').trim() || '铲屎官',
    department: currentGs.department || '千川剪辑部',
    skills: Array.isArray(currentGs.skills) ? currentGs.skills : [],
    hobbies: Array.isArray(currentGs.hobbies) ? currentGs.hobbies : [],
    badgeTheme: currentGs.badgeTheme || 'blue',
    hiredAt: currentGs.hiredAt || todayStr()
  };
  if (window.bongoAPI) window.bongoAPI.updateGameState(payload);
  if (!currentGs.onboarded && !isQuickSkip) {
    pawStamp.classList.add('stamped');
    setTimeout(() => window.close(), 720);
  } else {
    window.close();
  }
}

submitBtn.addEventListener('click', () => commitOnboarding(false));
skipBtn.addEventListener('click', () => {
  if (currentGs.onboarded) {
    window.close();
    return;
  }
  commitOnboarding(true);
});
document.getElementById('btn-close').addEventListener('click', () => window.close());

renderForm();
if (window.bongoAPI) {
  window.bongoAPI.getSettings().then((cfg) => {
    if (cfg) currentCfg = cfg;
    renderForm();
  });
  window.bongoAPI.getGameState().then((gs) => {
    if (gs) currentGs = { ...currentGs, ...gs };
    renderForm();
  });
  if (window.bongoAPI.getBadgePhoto) {
    window.bongoAPI.getBadgePhoto().then((url) => {
      if (url) {
        badgePhotoUrl = url;
        renderPhoto();
      }
    });
  }
  if (window.bongoAPI.onBadgePhotoChanged) {
    window.bongoAPI.onBadgePhotoChanged((url) => {
      badgePhotoUrl = url || '';
      renderPhoto();
    });
  }
}
