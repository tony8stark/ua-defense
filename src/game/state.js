// Game state factory: creates a fresh game state for a given city + difficulty
import { uid, resetIds, rnd } from './physics.js';

export function createGameState(city, mode) {
  resetIds();

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
  };
}

// Sync helper: extract UI-relevant state snapshot
export function getUIState(g) {
  const bHp = {};
  g.buildings.forEach(b => { bHp[b.key] = b.hp; });

  const counts = { turret: 0, crew: 0, airfield: 0 };
  g.towers.filter(t => t.hp > 0).forEach(t => { counts[t.type]++; });

  return {
    money: g.money,
    score: g.score,
    wave: g.wave,
    killed: g.killed,
    waveActive: g.waveActive,
    bHp,
    counts,
    logs: g.logs,
  };
}

export function addLog(g, msg) {
  g.logs = [{ msg, t: Date.now() }, ...g.logs].slice(0, 6);
}
