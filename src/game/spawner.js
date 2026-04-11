// Wave spawning and enemy creation
import { uid, rnd, chance } from './physics.js';
import { ENEMY_COLORS, ENEMY_SIZES } from '../data/enemies.js';
import { getSpawnPos, pickSpawnEdge } from '../data/cities.js';
import { createDeepIngressPlan, createGuidedWaypoints, shouldUseDeepIngress } from './enemy-ai.js';
import { getEnemySpawnProfile } from './waves.js';

const ENEMY_PRESSURE = {
  shahed: 1,
  geran: 1,
  orlan: 2,
  lancet: 2,
  shahed238: 2,
  guided: 3,
  kalibr: 3,
  kh101: 3,
};

const EARLY_CALM_WINDOW = 4;
const MAX_SHOCK_STREAK_WITH_CALM = 2;

function getEnemyPressure(type) {
  return ENEMY_PRESSURE[type] || 2;
}

function isCalmType(type) {
  return getEnemyPressure(type) <= 1;
}

function isShockType(type) {
  return getEnemyPressure(type) >= 2;
}

function findNextIndex(list, start, predicate) {
  for (let i = start; i < list.length; i++) {
    if (predicate(list[i])) return i;
  }
  return -1;
}

function softenWaveOpener(list) {
  const openerSize = Math.min(EARLY_CALM_WINDOW, list.length);
  if (list.slice(0, openerSize).some(isCalmType)) return;

  const calmerIndex = findNextIndex(list, openerSize, isCalmType);
  if (calmerIndex === -1) return;

  const insertAt = openerSize - 1;
  [list[insertAt], list[calmerIndex]] = [list[calmerIndex], list[insertAt]];
}

function breakShockStreaks(list) {
  let shockRun = 0;

  for (let i = 0; i < list.length; i++) {
    if (!isShockType(list[i])) {
      shockRun = 0;
      continue;
    }

    shockRun++;
    if (shockRun <= MAX_SHOCK_STREAK_WITH_CALM) continue;

    const calmerIndex = findNextIndex(list, i + 1, isCalmType);
    if (calmerIndex === -1) continue;

    [list[i], list[calmerIndex]] = [list[calmerIndex], list[i]];
    shockRun = 0;
  }
}

// Flatten wave definition into a chaotic list, then repair only the ugliest extremes
export function flatWave(waveDef) {
  const list = [];
  for (const g of waveDef.en) {
    for (let i = 0; i < g.n; i++) list.push(g.t);
  }
  // Fisher-Yates shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  softenWaveOpener(list);
  breakShockStreaks(list);
  return list;
}

// Pick a target for an enemy
export function getTargetDefenseChance(mode, enemyType, waveIndex = 0) {
  const base = mode?.[enemyType]?.targetDef || 0;
  if (!base) return 0;

  if (!mode?.targetDefRamp) return base;

  const start = Math.max(0, Math.min(1, mode.targetDefRamp.start ?? 0.1));
  const cap = Math.max(start, Math.min(base, mode.targetDefRamp.max ?? base));
  const rampWaves = Math.max(1, mode.targetDefRamp.waves ?? mode.endlessConfig?.referenceWaves ?? 18);
  const progress = Math.max(0, Math.min(1, waveIndex / rampWaves));

  return Math.round((start + (cap - start) * progress) * 100) / 100;
}

function pickTarget(g, enemyType) {
  const tdc = getTargetDefenseChance(g.mode, enemyType, g.wave);
  if (chance(tdc)) {
    // Guided drones: 60% chance to target a Decoy first (if any alive)
    if (enemyType === 'guided') {
      const decoys = g.towers.filter(t => t.type === 'decoy' && t.hp > 0);
      if (decoys.length > 0 && chance(0.60)) {
        return { mode: 'tower', id: decoys[Math.floor(Math.random() * decoys.length)].id };
      }
    }
    const activeDef = g.towers.filter(t => t.hp > 0);
    if (activeDef.length) {
      return { mode: 'tower', id: activeDef[Math.floor(Math.random() * activeDef.length)].id };
    }
  }
  const alive = g.buildings.filter(b => b.hp > 0);
  return alive.length
    ? { mode: 'building', key: alive[Math.floor(Math.random() * alive.length)].key }
    : null;
}

export function createEnemyState(g, type, target, pos = null, overrides = {}) {
  const et = getEnemySpawnProfile(g.mode, g.wave, type, g.mode[type]);
  if (!et) return null;

  const targetPoint = getTargetPoint(g, target);
  if (!targetPoint) return null;

  const deepIngress = shouldUseDeepIngress(type, g.wave, g.mode)
    ? createDeepIngressPlan(g.city, type, targetPoint)
    : null;
  const spawnPos = deepIngress?.spawn || pos || getSpawnPos(g.city, pickSpawnEdge(g.city));

  // Stealth: some Shaheds and Gerans fly low (invisible until near towers)
  const canStealth = (type === 'shahed' || type === 'geran');
  const stealthChance = type === 'shahed' ? 0.20 : 0.15;
  const isStealth = !deepIngress && canStealth && chance(stealthChance) && g.wave >= 3;

  // High-altitude approach: drones climb to 4000-5000m, bypass ground AA,
  // only HAWK/IRIS-T can engage. Descend near target building.
  const HIGH_APPROACH_TYPES = new Set(['shahed', 'geran', 'shahed238']);
  const baseHighChance = g.mode?.[type]?.highApproachChance || 0;
  // Ramp high-approach chance: 0 on wave 0-1, scales to full by wave 6
  const highWaveRamp = Math.min(1, Math.max(0, (g.wave - 1)) / 5);
  const highApproachChance = baseHighChance * highWaveRamp;
  const canHighApproach = HIGH_APPROACH_TYPES.has(type) && !isStealth && !deepIngress && g.wave >= 2;
  const isHighApproach = canHighApproach && chance(highApproachChance);

  // High-approach forces building target (mission-locked, no retaliation)
  let finalTarget = target;
  if (isHighApproach && target.mode === 'tower') {
    const alive = g.buildings.filter(b => b.hp > 0);
    if (alive.length) {
      finalTarget = { mode: 'building', key: alive[Math.floor(Math.random() * alive.length)].key };
    }
  }

  // Legacy altitude cycling (random bobbing for non-high-approach Shaheds)
  const canAltCycle = (type === 'shahed') && g.wave >= 3 && !isStealth && !deepIngress && !isHighApproach;
  const altCycleChance = 0.20;
  const hasAltCycle = canAltCycle && chance(altCycleChance);

  const enemy = {
    x: spawnPos.x,
    y: spawnPos.y,
    hp: et.hp,
    maxHp: et.hp,
    speed: et.speed,
    dmg: et.dmg,
    reward: et.reward,
    color: ENEMY_COLORS[type],
    sz: ENEMY_SIZES[type],
    type,
    target: finalTarget,
    id: uid(),
    angle: Math.PI,
    dodgeChance: et.dodgeChance || 0,
    stealth: isStealth,
    deepIngress,
    guidedPath: type === 'guided' ? createGuidedWaypoints(g.city, spawnPos, targetPoint) : null,
    guidedPathTarget: type === 'guided' ? `${target.mode}:${target.id || target.key || ''}` : null,
    // High-altitude approach: stay high until near target, then descend
    highApproach: isHighApproach,
    descentRadius: isHighApproach ? rnd(120, 160) : 0, // px from target to begin descent
    // Altitude cycling state
    altCycle: hasAltCycle,
    altitude: isHighApproach ? 'high' : deepIngress ? 'high' : hasAltCycle ? 'climbing' : null,
    altTimer: hasAltCycle ? rnd(40, 80) : 0,
    ...overrides,
  };

  // Apply Orlan recon wave buff (if any)
  if (g._waveBuff > 1.0) {
    enemy.hp = Math.round(enemy.hp * g._waveBuff);
    enemy.maxHp = enemy.hp;
  }

  return enemy;
}

// Spawn a single enemy
export function spawnEnemy(g, type) {
  // Kalibr only spawns on Odesa (sea-based cruise missile)
  if (type === 'kalibr' && g.city.id !== 'odesa') return;

  const target = pickTarget(g, type);
  if (!target) return;

  const enemy = createEnemyState(g, type, target);
  if (!enemy) return;

  g.enemies.push(enemy);

  // Track spawn stats
  g.totalSpawned++;
  if (g.spawnedByType[type] !== undefined) g.spawnedByType[type]++;
}

// Re-target an enemy that lost its target
export function retarget(g, enemy) {
  enemy.target = pickTarget(g, enemy.type);
}

// Resolve a target reference to an actual object
export function getTargetPoint(g, target) {
  if (!target) return null;
  if (target.mode === 'building') {
    const b = g.buildings.find(b => b.key === target.key);
    return (b && b.hp > 0) ? b : null;
  }
  if (target.mode === 'tower') {
    const t = g.towers.find(t => t.id === target.id);
    return (t && t.hp > 0) ? t : null;
  }
  return null;
}
