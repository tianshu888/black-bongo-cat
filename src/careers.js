export const CAREERS = [
  {
    level: 1, minXp: 0, title: '实习打杂喵',
    baseCoin: 1, critChance: 0.00, critBonus: 0, staminaCostMult: 1.00, promoteBonus: 0,
    tagline: '试用期摸鱼中 · 导素材/加字幕/求转正',
    perk: '基础 1 币/次'
  },
  {
    level: 2, minXp: 120, title: '剪辑喵',
    baseCoin: 1, critChance: 0.10, critBonus: 1, staminaCostMult: 0.94, promoteBonus: 30,
    tagline: '恭喜转正！正式员工到手 · 混剪卡点狂魔',
    perk: '10% 爆单+1 · 耗体-6%'
  },
  {
    level: 3, minXp: 320, title: '千川爆剪喵',
    baseCoin: 1, critChance: 0.18, critBonus: 1, staminaCostMult: 0.88, promoteBonus: 45,
    tagline: '黄金前3秒拿捏大师 · 专剪千川投流片',
    perk: '18% 爆单+1 · 耗体-12%'
  },
  {
    level: 4, minXp: 650, title: '脑洞策划喵',
    baseCoin: 1, critChance: 0.26, critBonus: 2, staminaCostMult: 0.82, promoteBonus: 60,
    tagline: '熬夜刷对标拆爆款 · 痛点钩子写到手软',
    perk: '26% 爆单+2 · 耗体-18%'
  },
  {
    level: 5, minXp: 1150, title: '王牌编导喵',
    baseCoin: 2, critChance: 0.22, critBonus: 1, staminaCostMult: 0.76, promoteBonus: 90,
    tagline: '选品定调画分镜一手抓 · 底薪翻倍起飞',
    perk: '底薪 2 币 · 22% 爆单+1'
  },
  {
    level: 6, minXp: 1850, title: '爆款导演喵',
    baseCoin: 2, critChance: 0.32, critBonus: 2, staminaCostMult: 0.70, promoteBonus: 120,
    tagline: '片场喊“卡”的猫 · 剧情带货短片天花板',
    perk: '底薪 2 币 · 32% 爆单+2'
  },
  {
    level: 7, minXp: 2800, title: '投流操盘喵',
    baseCoin: 2, critChance: 0.42, critBonus: 2, staminaCostMult: 0.65, promoteBonus: 160,
    tagline: '死盯ROI和点击率 · 一键放量冲上热门',
    perk: '底薪 2 币 · 42% 爆单+2'
  },
  {
    level: 8, minXp: 4100, title: '内容组长喵',
    baseCoin: 2, critChance: 0.50, critBonus: 3, staminaCostMult: 0.60, promoteBonus: 220,
    tagline: '左手催剪辑右手催编导 · 日更矩阵不断档',
    perk: '底薪 2 币 · 50% 爆单+3'
  },
  {
    level: 9, minXp: 5800, title: '运营总监喵',
    baseCoin: 3, critChance: 0.40, critBonus: 3, staminaCostMult: 0.56, promoteBonus: 300,
    tagline: '稳坐会议室盯GMV大盘 · 孵化爆品矩阵',
    perk: '底薪 3 币 · 40% 爆单+3'
  },
  {
    level: 10, minXp: 8000, title: 'MCN 喵老板',
    baseCoin: 3, critChance: 0.55, critBonus: 4, staminaCostMult: 0.50, promoteBonus: 500,
    tagline: '全公司人类给喵打工 · 躺赢GMV大额分红',
    perk: '底薪 3 币 · 55% 爆单+4'
  }
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
