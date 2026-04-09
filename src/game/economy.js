const BASE_WAVE_UPKEEP_PCT = 0.16;

export function getWaveUpkeepCost(g) {
  const upkeepMul = g.mode?.upkeepMul || 0;
  if (!upkeepMul) return 0;

  return Math.round(g.towers.reduce((sum, tower) => {
    if (tower.hp <= 0) return sum;

    const baseCost = tower.cost || g.mode?.[tower.type]?.baseCost || 0;
    const levelMul = 1 + (tower.level || 0) * 0.5;
    return sum + baseCost * BASE_WAVE_UPKEEP_PCT * upkeepMul * levelMul;
  }, 0));
}
