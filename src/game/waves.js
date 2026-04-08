const ENDLESS_REFERENCE_WAVES = 18;

const ENDLESS_TYPE_BIAS = {
  shahed: { hp: 1.0, speed: 1.15, dmg: 1.0, reward: 0.85, dodge: 0.3 },
  geran: { hp: 0.95, speed: 1.1, dmg: 1.0, reward: 0.85, dodge: 0.35 },
  lancet: { hp: 0.85, speed: 1.3, dmg: 1.15, reward: 0.9, dodge: 0.5 },
  shahed238: { hp: 0.95, speed: 1.35, dmg: 1.1, reward: 0.9, dodge: 0.55 },
  guided: { hp: 1.25, speed: 0.95, dmg: 1.2, reward: 1.0, dodge: 1.0 },
  kalibr: { hp: 1.15, speed: 1.05, dmg: 1.15, reward: 1.0, dodge: 0.6 },
  kh101: { hp: 1.1, speed: 1.08, dmg: 1.1, reward: 1.0, dodge: 0.75 },
  orlan: { hp: 0.9, speed: 1.15, dmg: 0.0, reward: 1.0, dodge: 0.4 },
};

function pushGroup(groups, cityId, type, count) {
  if (count <= 0) return;
  if (type === 'kalibr' && cityId !== 'odesa') return;
  groups.push({ t: type, n: count });
}

function getEndlessDoctrine(waveIndex) {
  if (waveIndex < 2) return 'probe';
  if ((waveIndex + 1) % 7 === 0) return 'overmatch';

  const cycle = ['saturation', 'raid', 'hunt', 'saturation', 'cruise'];
  return cycle[waveIndex % cycle.length];
}

function buildKobayashiWave(mode, waveIndex, city) {
  const cityId = city?.id;
  const doctrine = getEndlessDoctrine(waveIndex);
  const groups = [];

  switch (doctrine) {
    case 'probe':
      pushGroup(groups, cityId, 'shahed', 4 + waveIndex * 2);
      pushGroup(groups, cityId, 'geran', 1 + Math.floor(waveIndex / 2));
      pushGroup(groups, cityId, 'lancet', Math.max(0, waveIndex - 1));
      break;
    case 'saturation':
      pushGroup(groups, cityId, 'shahed', 7 + waveIndex * 2);
      pushGroup(groups, cityId, 'geran', 3 + Math.floor(waveIndex * 1.1));
      pushGroup(groups, cityId, 'lancet', 1 + Math.floor(waveIndex / 3));
      pushGroup(groups, cityId, 'shahed238', Math.max(0, Math.floor((waveIndex - 3) / 4)));
      pushGroup(groups, cityId, 'guided', Math.max(0, Math.floor((waveIndex - 6) / 5)));
      break;
    case 'raid':
      pushGroup(groups, cityId, 'shahed', 4 + Math.floor(waveIndex * 1.5));
      pushGroup(groups, cityId, 'geran', 3 + waveIndex);
      pushGroup(groups, cityId, 'lancet', 2 + Math.floor(waveIndex * 0.6));
      pushGroup(groups, cityId, 'shahed238', Math.max(0, 1 + Math.floor((waveIndex - 4) / 5)));
      pushGroup(groups, cityId, 'guided', Math.max(0, Math.floor((waveIndex - 7) / 6)));
      break;
    case 'hunt':
      pushGroup(groups, cityId, 'shahed', 3 + Math.floor(waveIndex * 1.2));
      pushGroup(groups, cityId, 'geran', 4 + Math.floor(waveIndex * 1.1));
      pushGroup(groups, cityId, 'lancet', 2 + Math.floor(waveIndex * 0.7));
      pushGroup(groups, cityId, 'guided', 1 + Math.floor(waveIndex / 6));
      break;
    case 'cruise':
      pushGroup(groups, cityId, 'shahed', 5 + waveIndex);
      pushGroup(groups, cityId, 'geran', 2 + Math.floor(waveIndex * 0.6));
      pushGroup(groups, cityId, 'lancet', Math.max(0, Math.floor((waveIndex - 2) / 4)));
      pushGroup(groups, cityId, 'shahed238', Math.max(0, Math.floor((waveIndex - 2) / 5)));
      pushGroup(groups, cityId, 'guided', 1 + Math.floor(waveIndex / 5));
      pushGroup(groups, cityId, 'kh101', Math.max(0, 1 + Math.floor((waveIndex - 5) / 6)));
      pushGroup(groups, cityId, 'kalibr', Math.max(0, 1 + Math.floor((waveIndex - 7) / 7)));
      break;
    case 'overmatch':
      pushGroup(groups, cityId, 'shahed', 8 + waveIndex * 2);
      pushGroup(groups, cityId, 'geran', 4 + Math.floor(waveIndex * 1.2));
      pushGroup(groups, cityId, 'lancet', 3 + Math.floor(waveIndex * 0.8));
      pushGroup(groups, cityId, 'shahed238', 1 + Math.floor(waveIndex / 4));
      pushGroup(groups, cityId, 'guided', 1 + Math.floor(waveIndex / 4));
      pushGroup(groups, cityId, 'kh101', Math.max(0, 1 + Math.floor((waveIndex - 5) / 5)));
      pushGroup(groups, cityId, 'kalibr', Math.max(0, 1 + Math.floor((waveIndex - 6) / 6)));
      break;
  }

  const baseDelay = mode.endlessConfig?.baseDelay ?? 52;
  const minDelay = mode.endlessConfig?.minDelay ?? 12;
  const doctrineBias = {
    probe: 0,
    saturation: -2,
    raid: -4,
    hunt: -5,
    cruise: -4,
    overmatch: -8,
  };

  return {
    en: groups,
    d: Math.max(minDelay, baseDelay - waveIndex * 2 + (doctrineBias[doctrine] || 0)),
    doctrine,
    endlessWave: true,
  };
}

export function isEndlessMode(mode) {
  return !!mode?.endless;
}

export function getFiniteWaveCount(mode) {
  return Array.isArray(mode?.waves) ? mode.waves.length : 0;
}

export function getWaveDisplayTotal(mode) {
  return isEndlessMode(mode) ? '∞' : String(getFiniteWaveCount(mode));
}

export function hasMoreWaves(mode, waveIndex) {
  return isEndlessMode(mode) || waveIndex < getFiniteWaveCount(mode);
}

export function getWaveProgressRatio(mode, waveIndex) {
  if (isEndlessMode(mode)) {
    return Math.min(1, waveIndex / (mode.endlessConfig?.referenceWaves ?? ENDLESS_REFERENCE_WAVES));
  }

  const totalWaves = getFiniteWaveCount(mode);
  return totalWaves > 0 ? waveIndex / totalWaves : 0;
}

export function getWaveDef(mode, waveIndex, city) {
  if (!hasMoreWaves(mode, waveIndex)) return null;
  if (!isEndlessMode(mode)) return mode.waves[waveIndex] || null;

  return buildKobayashiWave(mode, waveIndex, city);
}

export function getEnemySpawnProfile(mode, waveIndex, type, baseStats) {
  if (!baseStats) return null;
  if (!isEndlessMode(mode)) return { ...baseStats };

  const stage = waveIndex + 1;
  const bias = ENDLESS_TYPE_BIAS[type] || { hp: 1, speed: 1, dmg: 1, reward: 1, dodge: 0.5 };
  const hpMul = 1 + Math.min(1.8, stage * 0.045 * bias.hp);
  const speedMul = 1 + Math.min(0.55, stage * 0.012 * bias.speed);
  const dmgMul = 1 + Math.min(1.0, stage * 0.028 * bias.dmg);
  const rewardMul = 1 + Math.min(0.7, stage * 0.016 * bias.reward);
  const dodgeBonus = Math.min(0.18, stage * 0.0035 * bias.dodge);

  const next = { ...baseStats };

  if (typeof baseStats.hp === 'number') next.hp = Math.round(baseStats.hp * hpMul);
  if (typeof baseStats.speed === 'number') next.speed = Math.round(baseStats.speed * speedMul * 100) / 100;
  if (typeof baseStats.dmg === 'number') next.dmg = Math.round(baseStats.dmg * dmgMul);
  if (typeof baseStats.reward === 'number') next.reward = Math.max(baseStats.reward, Math.round(baseStats.reward * rewardMul));
  if (typeof baseStats.dodgeChance === 'number') {
    next.dodgeChance = Math.min(0.75, Math.round((baseStats.dodgeChance + dodgeBonus) * 100) / 100);
  }

  return next;
}
