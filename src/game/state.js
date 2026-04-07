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
    // Events
    f16: null,
    f16Cooldown: 0,
    ewActive: null,
    ewCooldown: 0,
    weather: rollWeather(),
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
    waveActive: g.waveActive,
    bHp,
    counts,
    logs: g.logs,
    weather: g.weather,
    ewActive: !!g.ewActive,
    f16Active: !!g.f16,
  };
}

export function addLog(g, msg) {
  g.logs = [{ msg, t: Date.now() }, ...g.logs].slice(0, 8);
}
