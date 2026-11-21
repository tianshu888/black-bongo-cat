export const CAREERS = [
  { level: 1, minXp: 0,    title: '实习敲键喵', baseCoin: 1, critChance: 0.00, critBonus: 0, staminaCostMult: 1.00, perk: '基础 1 币/次' },
  { level: 2, minXp: 120,  title: '初级码字喵', baseCoin: 1, critChance: 0.12, critBonus: 1, staminaCostMult: 0.92, perk: '12% 奖金+1 · 体力耗-8%' },
  { level: 3, minXp: 350,  title: '全栈摸鱼喵', baseCoin: 1, critChance: 0.22, critBonus: 1, staminaCostMult: 0.85, perk: '22% 奖金+1 · 体力耗-15%' },
  { level: 4, minXp: 750,  title: '资深鼠标喵', baseCoin: 1, critChance: 0.32, critBonus: 2, staminaCostMult: 0.80, perk: '32% 奖金+2 · 体力耗-20%' },
  { level: 5, minXp: 1400, title: '代码架构喵', baseCoin: 2, critChance: 0.25, critBonus: 1, staminaCostMult: 0.75, perk: '底薪 2 币 · 25% 奖金+1' },
  { level: 6, minXp: 2400, title: '产品总监喵', baseCoin: 2, critChance: 0.38, critBonus: 2, staminaCostMult: 0.70, perk: '底薪 2 币 · 38% 奖金+2' },
  { level: 7, minXp: 4000, title: '摸鱼副总裁', baseCoin: 2, critChance: 0.50, critBonus: 2, staminaCostMult: 0.65, perk: '底薪 2 币 · 50% 分红+2' },
  { level: 8, minXp: 6500, title: '喵界董事长', baseCoin: 3, critChance: 0.45, critBonus: 3, staminaCostMult: 0.60, perk: '底薪 3 币 · 45% 分红+3' }
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
