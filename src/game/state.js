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
    spawnedByType: { shahed: 0, shahed238: 0, geran: 0, lancet: 0, guided: 0, orlan: 0, kalibr: 0, kh101: 0 },
    killedByType: { shahed: 0, shahed238: 0, geran: 0, lancet: 0, guided: 0, orlan: 0, kalibr: 0, kh101: 0 },
    // Events
    f16: null,
    f16Cooldown: 0,
    ewActive: null,
    ewCooldown: 0,
    weather: rollWeather(),
    // Active ability: "Тривога!"
    trivogaActive: 0,    // ticks remaining for buff
    trivogaCooldown: 0,  // ticks remaining until can use again
    trivogaUses: 0,      // total uses this game
    // Orlan recon: buff multiplier for next wave (1.0 = no buff)
    nextWaveBuff: 1.0,
    orlanEscapes: 0,
    // Combo kill streak
    comboCount: 0,
    comboTimer: 0, // ticks remaining for combo window
    bestCombo: 0,
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

  const counts = { turret: 0, mvg: 0, crew: 0, airfield: 0, hawk: 0, gepard: 0, irist: 0, decoy: 0 };
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
    bestCombo: g.bestCombo,
    trivogaActive: g.trivogaActive > 0,
    trivogaCooldown: g.trivogaCooldown,
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

// Compute active building bonuses (only from alive buildings)
export function getBuildingBonuses(g) {
  const bonuses = { waveBonus: 0, range: 0, damage: 0, accuracy: 0, repairDiscount: 0 };
  for (const b of g.buildings) {
    if (b.hp > 0 && b.bonus) {
      switch (b.bonus.type) {
        case 'waveBonus': bonuses.waveBonus += b.bonus.value; break;
        case 'range': bonuses.range += b.bonus.value; break;
        case 'damage': bonuses.damage += b.bonus.value; break;
        case 'accuracy': bonuses.accuracy += b.bonus.value; break;
        case 'repair': bonuses.repairDiscount = b.bonus.value; break;
      }
    }
  }
  return bonuses;
}

export function addLog(g, msg) {
  g.logs = [{ msg, t: Date.now() }, ...g.logs].slice(0, 20);
}

// Combo system: call on every kill to track streaks
const COMBO_WINDOW = 45; // ticks (~2.5s at base speed)
const COMBO_THRESHOLDS = [
  { min: 3, mul: 1.2, label: 'Серія x3!' },
  { min: 5, mul: 1.5, label: 'Серія x5!' },
  { min: 8, mul: 1.8, label: 'Масове знищення!' },
  { min: 12, mul: 2.0, label: 'ГЕРОЙ ППО!' },
];

export function registerKill(g, reward, x, y) {
  g.comboCount++;
  g.comboTimer = COMBO_WINDOW;
  if (g.comboCount > g.bestCombo) g.bestCombo = g.comboCount;

  // Find highest matching threshold
  let bonus = 0;
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = COMBO_THRESHOLDS[i];
    if (g.comboCount === t.min) {
      bonus = Math.round(reward * (t.mul - 1));
      g.money += bonus;
      g.score += bonus;
      addLog(g, `🔥 ${t.label} +${bonus}💰`);
      g.floats.push({ x, y: y - 24, text: t.label, color: '#fbbf24', life: 60, ml: 60 });
      break;
    }
  }
  return bonus;
}

// Тривога! active ability
const TRIVOGA_DURATION = 90;   // ~5s buff at base speed
const TRIVOGA_COOLDOWN = 810;  // ~45s cooldown at base speed

export function activateTrivoga(g) {
  if (g.trivogaCooldown > 0 || g.trivogaActive > 0) return false;
  g.trivogaActive = TRIVOGA_DURATION;
  g.trivogaCooldown = TRIVOGA_COOLDOWN;
  g.trivogaUses++;
  addLog(g, '🚨 ТРИВОГА! Всі системи на максимум!');
  return true;
}

export function updateTrivoga(g) {
  if (g.trivogaActive > 0) g.trivogaActive--;
  if (g.trivogaCooldown > 0) g.trivogaCooldown--;
}

export function getTrivogaFireRateMul(g) {
  return g.trivogaActive > 0 ? 0.5 : 1.0; // 0.5 = 50% faster (lower fireRate = faster)
}

export function updateCombo(g) {
  if (g.comboTimer > 0) {
    g.comboTimer--;
    if (g.comboTimer <= 0) {
      g.comboCount = 0;
    }
  }
}
