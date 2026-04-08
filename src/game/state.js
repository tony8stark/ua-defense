// Game state factory: creates a fresh game state for a given city + difficulty
import { uid, resetIds, rnd } from './physics.js';
import { resetCallsigns } from '../data/callsigns.js';
import { rollWeather } from './events.js';

export function createGameState(city, mode) {
  resetIds();
  resetCallsigns();

  const buildings = city.buildings.map(b => ({
    ...b,
    hp: b.maxHp,
    id: uid(),
  }));

  return {
    city,
    mode,
    buildings,
    towers: [],
    enemies: [],
    projectiles: [],
    friendlyDrones: [],
    kukurzniki: [],
    explosions: [],
    particles: [],
    floats: [],
    money: mode.startMoney,
    score: 0,
    wave: 0,
    killed: 0,
    waveActive: false,
    spawnQueue: [],
    spawnTimer: 0,
    tick: 0,
    waveDelay: 50,
    iskanderTimer: rnd(mode.iskander.interval[0], mode.iskander.interval[1]),
    iskanderWarn: null,
    logs: [],
    // Unit roster: tracks ALL units ever placed (for end-game summary)
    unitRoster: [],
    // Spawn/kill stats per enemy type
    totalSpawned: 0,
    spawnedByType: { shahed: 0, shahed238: 0, geran: 0, lancet: 0, guided: 0 },
    killedByType: { shahed: 0, shahed238: 0, geran: 0, lancet: 0, guided: 0 },
    // Events
    f16: null,
    f16Cooldown: 0,
    ewActive: null,
    ewCooldown: 0,
    weather: rollWeather(),
    // Patriot interception
    patriotInterceptions: 0,
    patriotMax: 3,
    patriotAnim: null,
  };
}

// Sync helper: extract UI-relevant state snapshot
export function getUIState(g) {
  const bHp = {};
  g.buildings.forEach(b => { bHp[b.key] = b.hp; });

  const counts = { turret: 0, crew: 0, airfield: 0, decoy: 0 };
  g.towers.filter(t => t.hp > 0).forEach(t => { counts[t.type]++; });

  return {
    money: g.money,
    score: g.score,
    wave: g.wave,
    killed: g.killed,
    totalSpawned: g.totalSpawned,
    spawnedByType: { ...g.spawnedByType },
    killedByType: { ...g.killedByType },
    waveActive: g.waveActive,
    bHp,
    counts,
    logs: g.logs,
    weather: g.weather,
    ewActive: !!g.ewActive,
    f16Active: !!g.f16,
    patriotInterceptions: g.patriotInterceptions,
    towers: g.towers.filter(t => t.hp > 0).map(t => ({ id: t.id, type: t.type, callsign: t.callsign, kills: t.kills || 0, hp: t.hp, maxHp: t.maxHp })),
  };
}

// Register a new tower in the roster
export function registerUnit(g, tower) {
  g.unitRoster.push({
    id: tower.id,
    type: tower.type,
    callsign: tower.callsign,
    kills: 0,
    alive: true,
    soldByPlayer: false,
  });
}

// Mark a unit as destroyed in roster
export function markUnitDestroyed(g, towerId) {
  const entry = g.unitRoster.find(u => u.id === towerId);
  if (entry) entry.alive = false;
}

// Mark a unit as sold in roster
export function markUnitSold(g, towerId) {
  const entry = g.unitRoster.find(u => u.id === towerId);
  if (entry) { entry.alive = false; entry.soldByPlayer = true; }
}

// Sync kills from live towers into roster
export function syncRosterKills(g) {
  for (const t of g.towers) {
    const entry = g.unitRoster.find(u => u.id === t.id);
    if (entry) entry.kills = t.kills || 0;
  }
}

// Get final roster for results screen
export function getFinalRoster(g) {
  syncRosterKills(g);
  return g.unitRoster.map(u => ({ ...u }));
}

export function addLog(g, msg) {
  g.logs = [{ msg, t: Date.now() }, ...g.logs].slice(0, 20);
}
