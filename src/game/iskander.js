// Iskander ballistic missile subsystem
import { TICK, dist, rnd } from './physics.js';
import { GRID } from '../data/cities.js';
import { DEF_META } from '../data/units.js';
import { addLog } from './state.js';
import { playSiren, playExplosion } from '../audio/SoundManager.js';

export function updateIskander(g) {
  const m = g.mode;
  if (!g.waveActive && g.wave === 0) return;

  g.iskanderTimer -= TICK;

  if (g.iskanderWarn) {
    g.iskanderWarn.life -= TICK;
    if (g.iskanderWarn.life <= 0) {
      impact(g, m);
    }
  } else if (g.iskanderTimer <= 0) {
    spawnWarning(g, m);
  }
}

function spawnWarning(g, m) {
  const city = g.city;
  const zone = city.placeZone;
  const cols = Math.floor((zone.right - zone.left) / GRID);
  const rows = Math.floor(city.height / GRID);
  const gx = zone.left + Math.floor(Math.random() * cols) * GRID + GRID / 2;
  const gy = Math.floor(Math.random() * rows) * GRID + GRID / 2;

  g.iskanderWarn = { x: gx, y: gy, life: m.iskander.warnTicks };
  addLog(g, '🚀 ІСКАНДЕР — УВАГА! Удар через секунди!');
  playSiren();
}

function impact(g, m) {
  const iw = g.iskanderWarn;

  // Direct hit on towers
  for (const tw of g.towers) {
    if (tw.hp <= 0) continue;
    const d = dist(tw, { x: iw.x, y: iw.y });
    if (d < GRID * 0.6) {
      tw.hp = 0;
      if (tw.type === 'airfield') {
        g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== tw.id);
      }
      addLog(g, `🚀 ІСКАНДЕР знищив ${DEF_META[tw.type].name}!`);
    } else if (d < GRID * 1.6) {
      tw.hp = Math.max(0, tw.hp - Math.round(tw.maxHp * m.iskander.splashPct));
      if (tw.hp <= 0 && tw.type === 'airfield') {
        g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== tw.id);
      }
    }
  }

  // Damage buildings in range
  for (const b of g.buildings) {
    if (b.hp <= 0) continue;
    if (dist(b, { x: iw.x, y: iw.y }) < GRID * 1.2) {
      b.hp = Math.max(0, b.hp - 30);
    }
  }

  // Visual effects
  g.explosions.push({ x: iw.x, y: iw.y, r: 50, life: 40, ml: 40 });
  playExplosion(true);
  for (let i = 0; i < 20; i++) {
    g.particles.push({
      x: iw.x + rnd(-20, 20), y: iw.y + rnd(-20, 20),
      vx: rnd(-4, 4), vy: rnd(-5, 1),
      life: rnd(20, 50), color: i % 3 === 0 ? '#fbbf24' : '#ef4444',
    });
  }

  g.iskanderWarn = null;
  g.iskanderTimer = rnd(m.iskander.interval[0], m.iskander.interval[1]);
}
