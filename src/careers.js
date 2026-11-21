export const CAREERS = [
  {
    level: 1, minXp: 0, title: '实习打杂喵',
    baseCoin: 1, critChance: 0.00, critBonus: 0, staminaCostMult: 1.00, promoteBonus: 0,
    tagline: '试用期摸鱼中 · 导素材/加字幕/求转正',
    perk: '基础 1 币/次'
  },
  {
    level: 2, minXp: 120, title: '剪辑喵',
    baseCoin: 2, critChance: 0.10, critBonus: 1, staminaCostMult: 0.94, promoteBonus: 80,
    tagline: '恭喜转正！正式员工到手 · 混剪卡点狂魔',
    perk: '基础 2 币 · 10% 爆单+1 · 耗体-6%'
  },
  {
    level: 3, minXp: 320, title: '千川爆剪喵',
    baseCoin: 3, critChance: 0.16, critBonus: 2, staminaCostMult: 0.88, promoteBonus: 150,
    tagline: '黄金前3秒拿捏大师 · 专剪千川投流片',
    perk: '基础 3 币 · 16% 爆单+2 · 耗体-12%'
  },
  {
    level: 4, minXp: 650, title: '脑洞策划喵',
    baseCoin: 4, critChance: 0.22, critBonus: 2, staminaCostMult: 0.82, promoteBonus: 260,
    tagline: '熬夜刷对标拆爆款 · 痛点钩子写到手软',
    perk: '基础 4 币 · 22% 爆单+2 · 耗体-18%'
  },
  {
    level: 5, minXp: 1150, title: '王牌编导喵',
    baseCoin: 5, critChance: 0.26, critBonus: 3, staminaCostMult: 0.76, promoteBonus: 420,
    tagline: '选品定调画分镜一手抓 · 稳拿高薪档',
    perk: '基础 5 币 · 26% 爆单+3 · 耗体-24%'
  },
  {
    level: 6, minXp: 1850, title: '爆款导演喵',
    baseCoin: 6, critChance: 0.32, critBonus: 4, staminaCostMult: 0.70, promoteBonus: 650,
    tagline: '片场喊“卡”的猫 · 剧情带货短片天花板',
    perk: '基础 6 币 · 32% 爆单+4 · 耗体-30%'
  },
  {
    level: 7, minXp: 2800, title: '投流操盘喵',
    baseCoin: 8, critChance: 0.36, critBonus: 5, staminaCostMult: 0.65, promoteBonus: 1000,
    tagline: '死盯ROI和点击率 · 一键放量冲上热门',
    perk: '基础 8 币 · 36% 爆单+5 · 耗体-35%'
  },
  {
    level: 8, minXp: 4100, title: '内容组长喵',
    baseCoin: 10, critChance: 0.42, critBonus: 6, staminaCostMult: 0.60, promoteBonus: 1500,
    tagline: '左手催剪辑右手催编导 · 日更矩阵不断档',
    perk: '基础 10 币 · 42% 爆单+6 · 耗体-40%'
  },
  {
    level: 9, minXp: 5800, title: '运营总监喵',
    baseCoin: 12, critChance: 0.46, critBonus: 8, staminaCostMult: 0.55, promoteBonus: 2200,
    tagline: '稳坐会议室盯GMV大盘 · 孵化爆品矩阵',
    perk: '基础 12 币 · 46% 爆单+8 · 耗体-45%'
  },
  {
    level: 10, minXp: 8000, title: 'MCN 喵老板',
    baseCoin: 16, critChance: 0.52, critBonus: 10, staminaCostMult: 0.50, promoteBonus: 3500,
    tagline: '全公司人类给喵打工 · 躺赢GMV大额分红',
    perk: '基础 16 币 · 52% 爆单+10 · 耗体-50%'
  }
];

export const SHOP_ITEMS = [
  { id: 'kibble', action: 'feedKibble', name: '脆脆猫粮', price: 80,  desc: '饱食+35  体力+35  心情+6' },
  { id: 'churu',  action: 'feedChuru',  name: '鲜香猫条', price: 260, desc: '饱食+25  体力+45  心情+28  亲密+18' },
  { id: 'can',    action: 'feedCan',    name: '豪华罐头', price: 680, desc: '饱食+75  体力+100  心情+45  亲密+30' },
  { id: 'yarn',   action: 'playYarn',   name: '毛线球',   price: 120, desc: '心情+25  亲密+10  体力-6' },
  { id: 'wand',   action: 'playWand',   name: '逗猫棒',   price: 220, desc: '心情+35  亲密+20  经验+15' }
];

export const ACCESSORIES = [
  { id: 'none',       label: '无饰品', levelReq: 1, price: 0 },
  { id: 'bell',       label: '金铃铛', levelReq: 2, price: 180 },
  { id: 'bowtie',     label: '蝴蝶结', levelReq: 4, price: 480 },
  { id: 'headphones', label: '小耳机', levelReq: 6, price: 1200 },
  { id: 'beret',      label: '贝雷帽', levelReq: 8, price: 2800 }
];

export function getCareerInfo(workXp = 0) {
  let current = CAREERS[0];
  let next = CAREERS[1] || null;
  for (let i = 0; i < CAREERS.length; i++) {
    if (workXp >= CAREERS[i].minXp) {
      current = CAREERS[i];
      next = CAREERS[i + 1] || null;
    }
  }
  const prevXp = current.minXp;
  const nextXp = next ? next.minXp : current.minXp;
  const progress = next ? Math.max(0, Math.min(1, (workXp - prevXp) / (nextXp - prevXp))) : 1;
  return { current, next, progress };
}

export function getBadgeTier(level = 1) {
  if (level >= 9) {
    return {
      key: 'boss',
      label: 'BOSS',
      badgeColor: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.55)',
      bg: 'linear-gradient(135deg, rgba(39,39,42,0.96), rgba(120,53,15,0.45))'
    };
  }
  if (level >= 6) {
    return {
      key: 'pro',
      label: '骨干',
      badgeColor: '#c084fc',
      border: 'rgba(192, 132, 252, 0.52)',
      bg: 'linear-gradient(135deg, rgba(49,46,129,0.58), rgba(88,28,135,0.46))'
    };
  }
  if (level >= 2) {
    return {
      key: 'verified',
      label: '已转正',
      badgeColor: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.45)',
      bg: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(3,105,161,0.42))'
    };
  }
  return {
    key: 'intern',
    label: '试用期',
    badgeColor: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.38)',
    bg: 'linear-gradient(135deg, rgba(30,41,59,0.88), rgba(51,65,85,0.46))'
  };
}

export function formatOwnerCall(gs = {}) {
  return (gs.ownerName || '').trim() || '铲屎官';
}

export function getShortOwnerCall(gs = {}) {
  return (gs.ownerName || '').trim() || '铲屎官';
}
