const ownerNameEl = document.getElementById('owner-name');
const catNameEl = document.getElementById('cat-name');
const petNicknameEl = document.getElementById('pet-nickname');
const bloodTypeEl = document.getElementById('blood-type');
const hobbiesEl = document.getElementById('hobbies');
const skillsEl = document.getElementById('skills');
const photoBox = document.getElementById('photo-box');
const submitBtn = document.getElementById('btn-submit');
const skipBtn = document.getElementById('btn-skip');

let currentGs = {
  onboarded: false,
  ownerName: '',
  catName: '',
  petNickname: '',
  bloodType: '',
  hobbies: '',
  skills: ''
};
let badgePhotoUrl = '';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toText(v) {
  if (Array.isArray(v)) return v.join('、');
  return typeof v === 'string' ? v : '';
}

function renderPhoto() {
  if (!badgePhotoUrl) return;
  photoBox.innerHTML = `<img src="${badgePhotoUrl}" alt="工牌头像" />`;
}

function syncBloodPills() {
  const cur = bloodTypeEl.value.trim();
  document.querySelectorAll('.blood-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.blood === cur);
  });
}

function applyState(gs) {
  if (!gs) return;
  currentGs = { ...currentGs, ...gs };
  if (gs.onboarded) {
    ownerNameEl.value = gs.ownerName || '';
    catNameEl.value = gs.catName || '';
    petNicknameEl.value = gs.petNickname || '';
    bloodTypeEl.value = gs.bloodType || '';
    hobbiesEl.value = toText(gs.hobbies);
    skillsEl.value = toText(gs.skills);
    skipBtn.textContent = '取消';
    submitBtn.textContent = '保存';
    syncBloodPills();
  }
}

document.querySelectorAll('.blood-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.blood;
    bloodTypeEl.value = (bloodTypeEl.value.trim() === val) ? '' : val;
    syncBloodPills();
  });
});

bloodTypeEl.addEventListener('input', syncBloodPills);

document.getElementById('btn-capture-3d').addEventListener('click', async () => {
  if (!window.bongoAPI || !window.bongoAPI.captureCatPhoto) return;
  const dataUrl = await window.bongoAPI.captureCatPhoto({ pose: 'normal', theme: 'blue' });
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

submitBtn.addEventListener('click', () => {
  if (window.bongoAPI) {
    window.bongoAPI.updateGameState({
      onboarded: true,
      employeeId: currentGs.employeeId || 'MC-0001',
      ownerName: ownerNameEl.value.trim(),
      catName: catNameEl.value.trim(),
      petNickname: petNicknameEl.value.trim(),
      bloodType: bloodTypeEl.value.trim(),
      hobbies: hobbiesEl.value.trim(),
      skills: skillsEl.value.trim(),
      hiredAt: currentGs.hiredAt || todayStr()
    });
  }
  window.close();
});

skipBtn.addEventListener('click', () => {
  if (!currentGs.onboarded && window.bongoAPI) {
    window.bongoAPI.updateGameState({
      onboarded: true,
      employeeId: currentGs.employeeId || 'MC-0001',
      hiredAt: currentGs.hiredAt || todayStr()
    });
  }
  window.close();
});

document.getElementById('btn-close').addEventListener('click', () => window.close());

if (window.bongoAPI) {
  window.bongoAPI.getGameState().then(applyState);
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
