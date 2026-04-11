// Defense unit metadata (visuals, names)
export const DEF_META = {
  turret: { name: 'ЗУ Турель', color: '#4ade80', emoji: '🔫' },
  mvg: { name: 'МВГ', color: '#22d3ee', emoji: '🚗' },
  crew: { name: 'Екіпаж FPV', color: '#38bdf8', emoji: '🎮' },
  airfield: { name: 'Аеродром', color: '#f59e0b', emoji: '🛫' },
  hawk: { name: 'HAWK', color: '#a3e635', emoji: '🦅' },
  gepard: { name: 'Gepard', color: '#fb923c', emoji: '🐆' },
  irist: { name: 'IRIS-T', color: '#e879f9', emoji: '💎' },
  decoy: { name: 'Хибна ціль', color: '#94a3b8', emoji: '🪤' },
};

// Upgrade trees: each level gives multipliers applied to base stats
// Level 0 = base, Level 1 = first upgrade, Level 2 = max
export const UPGRADES = {
  turret: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.8, stats: { range: 1.2, damage: 1.3 }, desc: '+20% дальність, +30% урон' },
    { label: 'Рівень 3', costMul: 1.2, stats: { range: 1.35, damage: 1.5, fireRate: 0.8, hitChance: 1.15 }, desc: '+35% дальн, +50% урон, швидше, +15% точність' },
  ],
  mvg: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.7, stats: { damage: 1.25, hitChance: 1.1 }, desc: '+25% урон, +10% точність' },
    { label: 'Рівень 3', costMul: 1.0, stats: { damage: 1.4, range: 1.15, hitChance: 1.15 }, desc: '+40% урон, +15% дальн, +15% точність' },
  ],
  crew: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.8, stats: { hitChance: 1.2, damage: 1.15 }, desc: '+20% влучність, +15% урон' },
    { label: 'Рівень 3', costMul: 1.2, stats: { hitChance: 1.4, damage: 1.3, lossChance: 0.6 }, desc: '+40% влучн, +30% урон, -40% втрат' },
  ],
  airfield: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.8, stats: { range: 1.25, damage: 1.2 }, desc: '+25% дальність, +20% урон' },
    { label: 'Рівень 3', costMul: 1.2, stats: { range: 1.4, damage: 1.4, hitChance: 1.3 }, desc: '+40% дальн, +40% урон, +30% точність' },
  ],
  hawk: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.7, stats: { damage: 1.3, hitChance: 1.1 }, desc: '+30% урон, +10% точність' },
    { label: 'Рівень 3', costMul: 1.0, stats: { damage: 1.5, range: 1.2, hitChance: 1.15 }, desc: '+50% урон, +20% дальн, +15% точність' },
  ],
  gepard: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 0.7, stats: { range: 1.15, damage: 1.2 }, desc: '+15% дальність, +20% урон' },
    { label: 'Рівень 3', costMul: 1.0, stats: { range: 1.25, damage: 1.4, fireRate: 0.85 }, desc: '+25% дальн, +40% урон, швидше' },
  ],
  irist: [
    { label: 'Рівень 1', costMul: 0, stats: {} },
    { label: 'Рівень 2', costMul: 1.0, stats: { fireRate: 0.8, range: 1.15 }, desc: '-20% перезарядка, +15% дальність' },
    { label: 'Рівень 3', costMul: 1.5, stats: { fireRate: 0.65, range: 1.3 }, desc: '-35% перезарядка, +30% дальність' },
  ],
};

export const SELL_REFUND = 0.6; // 60% of purchase price

export function getCost(baseCost, escalation, existingCount) {
  return Math.round(baseCost * (1 + escalation * existingCount));
}

export function getUpgradeCost(tower, mode) {
  const nextLevel = (tower.level || 0) + 1;
  const upgrade = UPGRADES[tower.type]?.[nextLevel];
  if (!upgrade) return null;
  const baseCost = mode[tower.type].baseCost;
  return Math.round(baseCost * upgrade.costMul);
}

export function getSellPrice(tower) {
  return Math.round((tower.cost || 0) * SELL_REFUND);
}

export const REPAIR_COST_PER_HP = 0.6; // 0.6 coins per HP (repair should be cheaper than buying new)
export const BUILDING_REBUILD_HP_PCT = 0.4;
export const BUILDING_REBUILD_COST_PCT = 0.6;

export function getRepairCost(building, bonuses = {}) {
  const repairAmount = Math.max(0, (building.maxHp || 0) - (building.hp || 0));
  const repairDiscount = bonuses.repairDiscount || 0;
  return Math.round(repairAmount * REPAIR_COST_PER_HP * (1 - repairDiscount));
}

export function getRepairActionState(item, options = {}) {
  const hp = item?.hp || 0;
  const maxHp = item?.maxHp || 0;
  const amount = Math.max(0, maxHp - hp);
  const isTower = !!DEF_META[item?.type];
  const cost = getRepairCost(item, { repairDiscount: options.repairDiscount || 0 });

  let reason = null;
  if (hp <= 0) reason = 'destroyed';
  else if (amount <= 0) reason = 'full';
  else if (!isTower && options.waveActive) reason = 'betweenWaves';

  return {
    isTower,
    damaged: hp > 0 && amount > 0,
    amount,
    cost,
    allowed: reason === null,
    reason,
  };
}

export function getRebuildCost(building) {
  const maxHp = Math.max(0, building?.maxHp || 0);
  return Math.round(maxHp * REPAIR_COST_PER_HP * BUILDING_REBUILD_COST_PCT);
}

export function getRebuildActionState(item, options = {}) {
  const hp = item?.hp || 0;
  const maxHp = Math.max(0, item?.maxHp || 0);
  const restoreHp = Math.round(maxHp * BUILDING_REBUILD_HP_PCT);
  const isTower = !!DEF_META[item?.type];

  let reason = null;
  if (isTower) reason = 'notBuilding';
  else if (hp > 0) reason = 'notDestroyed';
  else if (maxHp <= 0) reason = 'invalid';
  else if (options.waveActive) reason = 'betweenWaves';

  return {
    rebuildable: !isTower && hp <= 0 && maxHp > 0,
    restoreHp: reason === 'notDestroyed' || reason === 'invalid' || reason === 'notBuilding' ? 0 : restoreHp,
    cost: reason === 'notDestroyed' || reason === 'invalid' || reason === 'notBuilding' ? 0 : getRebuildCost(item),
    allowed: reason === null,
    reason,
  };
}

export function getUnitBalanceScore(mode, unitType, options = {}) {
  const unit = mode[unitType];
  if (!unit) return 0;

  let damage = unit.damage ?? 0;
  let hitChance = unit.hitChance ?? 1;
  let burstCount = 1;

  if (unitType === 'gepard') burstCount = 2;
  if (unitType === 'crew') hitChance *= (1 - (unit.lossChance ?? 0));
  if (unitType === 'irist') damage = Math.min(damage, 260);
  if (options.antiFast && unitType === 'mvg') hitChance += 0.15;

  const expectedDps = damage * hitChance * burstCount / (unit.fireRate || 1);
  return Number(((expectedDps / unit.baseCost) * 100).toFixed(3));
}
