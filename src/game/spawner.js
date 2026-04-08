// Wave spawning and enemy creation
import { uid, rnd, chance } from './physics.js';
import { ENEMY_COLORS, ENEMY_SIZES } from '../data/enemies.js';
import { getSpawnPos, pickSpawnEdge } from '../data/cities.js';

// Flatten wave definition into shuffled list of enemy types
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
  return list;
}

// Pick a target for an enemy
function pickTarget(g, enemyType) {
  const tdc = g.mode[enemyType].targetDef;
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

// Spawn a single enemy
export function spawnEnemy(g, type) {
  // Kalibr only spawns on Odesa (sea-based cruise missile)
  if (type === 'kalibr' && g.city.id !== 'odesa') return;

  const et = g.mode[type];
  if (!et) return; // guard: enemy type not defined for this difficulty
  const target = pickTarget(g, type);
  if (!target) return;

  const edge = pickSpawnEdge(g.city);
  const pos = getSpawnPos(g.city, edge);

  // Stealth: some Shaheds and Gerans fly low (invisible until near towers)
  const canStealth = (type === 'shahed' || type === 'geran');
  const stealthChance = type === 'shahed' ? 0.20 : 0.15;
  const isStealth = canStealth && chance(stealthChance) && g.wave >= 3;

  // Altitude cycling: some Shaheds climb to 4000-4500m (harder to hit, but less accurate attack)
  const canAltCycle = (type === 'shahed') && g.wave >= 3 && !isStealth;
  const altCycleChance = 0.20;
  const hasAltCycle = canAltCycle && chance(altCycleChance);

  g.enemies.push({
    x: pos.x,
    y: pos.y,
    hp: et.hp,
    maxHp: et.hp,
    speed: et.speed,
    dmg: et.dmg,
    reward: et.reward,
    color: ENEMY_COLORS[type],
    sz: ENEMY_SIZES[type],
    type,
    target,
    id: uid(),
    angle: Math.PI,
    dodgeChance: et.dodgeChance || 0,
    stealth: isStealth,
    // Altitude cycling state
    altCycle: hasAltCycle,
    altitude: hasAltCycle ? 'climbing' : null, // null | 'climbing' | 'high' | 'diving' | 'low'
    altTimer: hasAltCycle ? rnd(40, 80) : 0,   // ticks until next phase change
  });

  // Apply Orlan recon wave buff (if any)
  if (g._waveBuff > 1.0) {
    const en = g.enemies[g.enemies.length - 1];
    en.hp = Math.round(en.hp * g._waveBuff);
    en.maxHp = en.hp;
  }

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
