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

export function getWaveRecoveryRelief(g) {
  const relief = g.mode?.lossRelief;
  if (!relief) return 0;
  if ((g.waveLosses || 0) <= 0) return 0;
  if (g.wave > (relief.untilWave ?? 4)) return 0;

  return Math.min(relief.cap ?? Infinity, g.waveLosses * (relief.perUnit ?? 0));
}
