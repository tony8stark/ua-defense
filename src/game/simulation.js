import { setMuted } from '../audio/SoundManager.js';
import { getCallsign } from '../data/callsigns.js';
import { MODES } from '../data/difficulty.js';
import { getCost, getRepairActionState, getUpgradeCost, UPGRADES } from '../data/units.js';
import { uid, rnd } from './physics.js';
import { canPlaceTowerAt } from './placement.js';
import {
  createGameState,
  getBuildingBonuses,
  registerUnit,
  trackRepairSpend,
  trackUnitSpend,
} from './state.js';
import { hasMoreWaves } from './waves.js';
import { startWave, update as updateGame } from './engine.js';

const CLEAR_WEATHER = { id: 'clear', label: 'Ясно', effects: {} };
const MAX_TICKS_PER_WAVE = 16000;
const DEFAULT_BUILD_ORDER = {
  kyiv: [
    { type: 'turret', x: 660, y: 240 },
    { type: 'turret', x: 660, y: 420 },
    { type: 'crew', x: 520, y: 300 },
    { type: 'hawk', x: 380, y: 240 },
    { type: 'decoy', x: 720, y: 320 },
    { type: 'turret', x: 770, y: 150 },
    { type: 'mvg', x: 600, y: 340 },
    { type: 'turret', x: 770, y: 510 },
    { type: 'crew', x: 460, y: 470 },
    { type: 'airfield', x: 250, y: 300 },
  ],
  odesa: [
    { type: 'turret', x: 520, y: 180 },
    { type: 'turret', x: 520, y: 360 },
    { type: 'crew', x: 380, y: 260 },
    { type: 'hawk', x: 250, y: 250 },
    { type: 'decoy', x: 560, y: 270 },
    { type: 'turret', x: 420, y: 120 },
    { type: 'mvg', x: 440, y: 310 },
    { type: 'turret', x: 420, y: 470 },
    { type: 'crew', x: 320, y: 380 },
    { type: 'airfield', x: 240, y: 520 },
  ],
};
const UPGRADE_PRIORITY = ['crew', 'hawk', 'turret', 'mvg', 'airfield', 'gepard', 'irist'];

function toNumber(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function totalBuildingHp(g) {
  return g.buildings.reduce((sum, building) => sum + Math.max(0, building.hp), 0);
}

function totalBuildingMaxHp(g) {
  return g.buildings.reduce((sum, building) => sum + building.maxHp, 0);
}

function createSeededRandom(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function getModeId(mode) {
  const entry = Object.entries(MODES).find(([, value]) => value === mode);
  return entry?.[0] || mode.id || null;
}

function withSimulationRuntime(seed, fn) {
  const originalRandom = Math.random;
  const originalSetTimeout = globalThis.setTimeout;
  Math.random = createSeededRandom(seed);
  globalThis.setTimeout = () => 0;
  setMuted(true);
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
    globalThis.setTimeout = originalSetTimeout;
  }
}

function forceClearWeather(g, clearWeather) {
  if (clearWeather) g.weather = { ...CLEAR_WEATHER };
}

function createTower(g, type, x, y, cost) {
  const def = g.mode[type];
  const tower = {
    x,
    y,
    type,
    ...def,
    cost,
    cooldown: 0,
    angle: 0,
    id: uid(),
    hp: def.maxHp,
    maxHp: def.maxHp,
    level: 0,
    callsign: getCallsign(),
    kills: 0,
  };

  if (type === 'mvg') {
    tower.originX = x;
    tower.originY = y;
    tower.patrolAngle = Math.random() * Math.PI;
    tower.patrolSeed = Math.random() * Math.PI * 2;
    tower.patrolRange = def.patrolRange || 56;
  }

  g.towers.push(tower);
  registerUnit(g, tower);
  trackUnitSpend(g, type, cost, 'purchase');

  if (type === 'airfield') {
    g.kukurzniki.push({
      x,
      y,
      angle: 0,
      px: x,
      py: y,
      oa: rnd(0, Math.PI * 2),
      or: 90,
      range: def.range,
      damage: def.damage,
      fireRate: def.fireRate,
      hitChance: def.hitChance,
      cooldown: 0,
      id: uid(),
      color: '#f59e0b',
      towerId: tower.id,
    });
  }

  g.money -= cost;
  return tower;
}

function tryPlaceTower(g, placement) {
  const def = g.mode[placement.type];
  if (!def) return false;

  const existing = g.towers.filter(tower => tower.type === placement.type && tower.hp > 0).length;
  if (existing >= def.maxCount) return false;

  const cost = getCost(def.baseCost, g.mode.costEsc, existing);
  if (g.money < cost) return false;

  const check = canPlaceTowerAt(g, placement.type, placement);
  if (!check.ok) return false;

  createTower(g, placement.type, check.snapped.x, check.snapped.y, cost);
  return true;
}

function tryUpgradeTower(g, tower) {
  const nextLevel = (tower.level || 0) + 1;
  const upgrade = UPGRADES[tower.type]?.[nextLevel];
  if (!upgrade) return false;

  const cost = getUpgradeCost(tower, g.mode);
  if (!cost || g.money < cost) return false;

  for (const [stat, mul] of Object.entries(upgrade.stats)) {
    if (stat === 'lossChance') {
      tower.lossChanceOverride = (tower.lossChanceOverride || g.mode.crew.lossChance) * mul;
    } else if (stat === 'fireRate') {
      tower[stat] = Math.round(tower[stat] * mul);
    } else {
      tower[stat] = Math.round(tower[stat] * mul * 100) / 100;
    }
  }

  tower.level = nextLevel;
  tower.hp = Math.min(tower.hp + 20, tower.maxHp);
  g.money -= cost;
  trackUnitSpend(g, tower.type, cost, 'upgrade');

  if (tower.type === 'airfield') {
    const kukuruznik = g.kukurzniki.find(unit => unit.towerId === tower.id);
    if (kukuruznik) {
      if (upgrade.stats.range) kukuruznik.range = Math.round(kukuruznik.range * upgrade.stats.range * 100) / 100;
      if (upgrade.stats.damage) kukuruznik.damage = Math.round(kukuruznik.damage * upgrade.stats.damage * 100) / 100;
      if (upgrade.stats.hitChance) kukuruznik.hitChance = Math.round(kukuruznik.hitChance * upgrade.stats.hitChance * 100) / 100;
    }
  }

  return true;
}

function tryRepairTarget(g, target, reserveMoney) {
  const repairState = getRepairActionState(target, {
    waveActive: false,
    repairDiscount: getBuildingBonuses(g).repairDiscount,
  });
  if (!repairState.allowed) return false;
  if (g.money - repairState.cost < reserveMoney) return false;

  target.hp = target.maxHp;
  g.money -= repairState.cost;
  trackRepairSpend(g, target.id ? `${target.type}:${target.id}` : target.key, repairState.cost);
  return true;
}

function getRepairTargets(g) {
  const liveTowers = g.towers
    .filter(tower => tower.hp > 0 && tower.hp < tower.maxHp)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  const buildings = g.buildings
    .filter(building => building.hp > 0 && building.hp < building.maxHp)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

  return [...liveTowers, ...buildings];
}

function getUpgradeCandidates(g) {
  return [...g.towers]
    .filter(tower => tower.hp > 0)
    .sort((a, b) => {
      const ap = UPGRADE_PRIORITY.indexOf(a.type);
      const bp = UPGRADE_PRIORITY.indexOf(b.type);
      if (ap !== bp) return ap - bp;
      return (a.level || 0) - (b.level || 0);
    });
}

function getTargetBuildCount(g, buildOrder) {
  const openerFloor = 5;
  return Math.min(buildOrder.length, openerFloor + g.wave * 2);
}

function getReserveMoney(g, buildOrder) {
  const baseReserve = g.wave === 0
    ? 0
    : Math.max(18, Math.round(g.mode.waveBonus * 0.35));
  const liveCount = g.towers.filter(tower => tower.hp > 0).length;
  const targetCount = getTargetBuildCount(g, buildOrder);

  if (liveCount < targetCount) {
    return g.wave <= 2 ? 0 : Math.min(baseReserve, 12);
  }

  return baseReserve;
}

function tryBuildFromPlan(g, buildOrder, reserveMoney) {
  for (const placement of buildOrder) {
    const def = g.mode[placement.type];
    if (!def) continue;

    const existing = g.towers.filter(tower => tower.type === placement.type && tower.hp > 0).length;
    if (existing >= def.maxCount) continue;

    const cost = getCost(def.baseCost, g.mode.costEsc, existing);
    if (g.money - cost < reserveMoney) continue;
    if (tryPlaceTower(g, placement)) return true;
  }

  return false;
}

function spendInterwaveBudget(g, buildOrder) {
  const reserveMoney = getReserveMoney(g, buildOrder);
  let spent = true;

  while (spent) {
    spent = false;

    if (tryBuildFromPlan(g, buildOrder, reserveMoney)) {
      spent = true;
      continue;
    }

    for (const target of getRepairTargets(g)) {
      const hpRatio = target.hp / target.maxHp;
      const threshold = target.type ? 0.55 : 0.7;
      if (hpRatio <= threshold && tryRepairTarget(g, target, reserveMoney)) {
        spent = true;
        break;
      }
    }
    if (spent) continue;

    if (tryBuildFromPlan(g, buildOrder, reserveMoney)) {
      spent = true;
      continue;
    }

    for (const tower of getUpgradeCandidates(g)) {
      const upgradeCost = getUpgradeCost(tower, g.mode);
      if (!upgradeCost || g.money - upgradeCost < reserveMoney) continue;
      if (tryUpgradeTower(g, tower)) {
        spent = true;
        break;
      }
    }
    if (spent) continue;

    for (const target of getRepairTargets(g)) {
      const hpRatio = target.hp / target.maxHp;
      if (hpRatio < 0.9 && tryRepairTarget(g, target, reserveMoney)) {
        spent = true;
        break;
      }
    }
  }
}

export function runSimulation({
  city,
  mode,
  seed,
  maxWaves = Array.isArray(mode?.waves) && mode.waves.length > 0 ? mode.waves.length : 10,
  clearWeather = false,
  buildOrder = DEFAULT_BUILD_ORDER[city?.id] || [],
} = {}) {
  return withSimulationRuntime(seed, () => {
    const g = createGameState(city, mode);
    let ended = 'max_waves';
    let timeoutWave = null;

    spendInterwaveBudget(g, buildOrder);
    const initialBuildCount = g.towers.length;

    while (g.wave < maxWaves && hasMoreWaves(g.mode, g.wave)) {
      forceClearWeather(g, clearWeather);
      if (!startWave(g)) break;
      forceClearWeather(g, clearWeather);

      let ticks = 0;
      let outcome = null;
      while ((g.waveActive || g.enemies.length > 0 || g.spawnQueue.length > 0 || g.explosions.length > 0) && ticks < MAX_TICKS_PER_WAVE) {
        outcome = updateGame(g);
        forceClearWeather(g, clearWeather);
        if (outcome === 'lost' || outcome === 'won') break;
        ticks++;
      }

      if (ticks >= MAX_TICKS_PER_WAVE) {
        ended = 'timeout';
        timeoutWave = g.wave + 1;
        break;
      }
      if (outcome === 'lost') {
        ended = 'lost';
        break;
      }
      if (outcome === 'won') {
        ended = 'won';
        break;
      }

      spendInterwaveBudget(g, buildOrder);
    }

    if (ended === 'max_waves' && g.wave < maxWaves && !hasMoreWaves(g.mode, g.wave)) {
      ended = 'won';
    }

    return {
      seed,
      cityId: city.id,
      modeId: getModeId(mode),
      modeLabel: mode.label,
      initialBuildCount,
      finalBuildCount: g.towers.filter(tower => tower.hp > 0).length,
      wavesCompleted: g.wave,
      lossWave: ended === 'lost' ? g.wave + 1 : timeoutWave,
      ended,
      score: g.score,
      money: g.money,
      kills: g.killed,
      totalSpawned: g.totalSpawned,
      // Fair kill stats (exclude the wave you lost on)
      fairKills: ended === 'lost' ? (g.completedWaveKills || g.killed) : g.killed,
      fairSpawned: ended === 'lost' ? (g.completedWaveSpawned || g.totalSpawned) : g.totalSpawned,
      remainingBuildingHp: totalBuildingHp(g),
      remainingBuildingHpPct: toNumber(totalBuildingHp(g) / totalBuildingMaxHp(g)),
      survivingBuildings: g.buildings.filter(building => building.hp > 0).length,
    };
  });
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

export function runBatchSimulation({
  city,
  mode,
  seeds,
  maxWaves = Array.isArray(mode?.waves) && mode.waves.length > 0 ? mode.waves.length : 10,
  clearWeather = false,
  buildOrder = DEFAULT_BUILD_ORDER[city?.id] || [],
} = {}) {
  const seedList = Array.isArray(seeds) ? seeds : Array.from({ length: Math.max(1, seeds || 1) }, (_, index) => index + 1);
  const results = seedList.map(seed => runSimulation({ city, mode, seed, maxWaves, clearWeather, buildOrder }));
  const wavesCompleted = results.map(result => result.wavesCompleted);
  const survivalByWave = {};
  const lossHistogram = {};

  for (let wave = 1; wave <= maxWaves; wave++) {
    const survivors = results.filter(result => result.wavesCompleted >= wave).length;
    survivalByWave[wave] = toNumber(survivors / results.length, 3);
  }

  for (const result of results) {
    if (!result.lossWave) continue;
    lossHistogram[result.lossWave] = (lossHistogram[result.lossWave] || 0) + 1;
  }

  return {
    cityId: city.id,
    modeId: getModeId(mode),
    modeLabel: mode.label,
    totalRuns: results.length,
    maxWaves,
    clearWeather,
    avgWavesCompleted: toNumber(wavesCompleted.reduce((sum, value) => sum + value, 0) / results.length),
    medianWavesCompleted: percentile(wavesCompleted, 0.5),
    p10WavesCompleted: percentile(wavesCompleted, 0.1),
    p90WavesCompleted: percentile(wavesCompleted, 0.9),
    avgRemainingBuildingHpPct: toNumber(results.reduce((sum, result) => sum + result.remainingBuildingHpPct, 0) / results.length, 3),
    survivalByWave,
    lossHistogram,
    results,
  };
}

export function getDefaultBuildOrder(cityId) {
  return (DEFAULT_BUILD_ORDER[cityId] || []).map(step => ({ ...step }));
}
