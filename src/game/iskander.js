// Iskander ballistic missile subsystem + Patriot interception
import { TICK, dist, rnd, chance } from './physics.js';
import { GRID } from '../data/cities.js';
import { addLog, markUnitDestroyed } from './state.js';
import { playSiren, playExplosion } from '../audio/SoundManager.js';
import { playPatriotLaunch } from '../audio/SoundManager.js';
import { getBattleCalloutText, getIskanderQuip, getPatriotQuip } from '../data/battleQuips.js';

const PATRIOT_CINEMATIC_FLY_TICKS = 72;
const PATRIOT_CINEMATIC_BLOOM_TICKS = 22;
const PATRIOT_CINEMATIC_TOTAL_TICKS = PATRIOT_CINEMATIC_FLY_TICKS + PATRIOT_CINEMATIC_BLOOM_TICKS;

function detonatePatriotIntercept(g, pa) {
  if (!pa || pa.detonated) return;

  pa.detonated = true;
  pa.detonationTick = pa.tick;
  g.patriotInterceptions++;
  addLog(g, `🛡️ ${getPatriotQuip()}`, {
    broadcast: { text: getBattleCalloutText('patriotHit', g.mode), life: 54, priority: 3, color: '#e2e8f0', accent: '#60a5fa' },
  });

  g.explosions.push({ x: pa.targetX, y: pa.targetY, r: 34, life: 26, ml: 26 });
  playExplosion(true);
  for (let i = 0; i < 18; i++) {
    g.particles.push({
      x: pa.targetX + rnd(-10, 10), y: pa.targetY + rnd(-10, 10),
      vx: rnd(-3, 3), vy: rnd(-4, 2),
      life: rnd(18, 40),
      color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#fbbf24' : '#60a5fa',
    });
  }
}

export function updatePatriotAnim(g) {
  const pa = g.patriotAnim;
  if (!pa) return false;

  pa.tick++;

  if (!pa.detonated && pa.tick >= pa.flyTicks) {
    detonatePatriotIntercept(g, pa);
  }

  if (pa.tick >= pa.totalTicks) {
    g.patriotAnim = null;
  }

  return true;
}

export function updateIskander(g) {
  const m = g.mode;
  const isHell = m.iskander.interval[0] < 600;
  const betweenWaves = !g.waveActive && g.wave > 0;

  // Resolve active Iskander warning
  if (g.iskanderWarn) {
    g.iskanderWarn.life -= TICK;
    if (g.iskanderWarn.life <= 0) {
      // Roll for Patriot intercept
      const patriotChance = m.iskander.patriotChance || 0;
      const cityBonus = g.city.bonuses?.patriotBonus || 0;
      if (g.patriotInterceptions < g.patriotMax && chance(patriotChance + cityBonus)) {
        intercept(g, m);
      } else {
        impact(g, m);
      }
    }
    return;
  }

  // Don't spawn new warnings between waves (except Hell)
  if (betweenWaves && !isHell) return;
  if (g.wave === 0 && !g.waveActive) return;

  g.iskanderTimer -= TICK;
  if (g.iskanderTimer <= 0) {
    spawnWarning(g, m);
  }
}

function spawnWarning(g, m) {
  const city = g.city;
  const zone = city.placeZone;
  let gx, gy;

  // 40% chance Iskander targets a Decoy instead of random position
  const aliveDecoys = g.towers.filter(t => t.type === 'decoy' && t.hp > 0);
  if (aliveDecoys.length > 0 && chance(0.40)) {
    const decoy = aliveDecoys[Math.floor(Math.random() * aliveDecoys.length)];
    gx = decoy.x;
    gy = decoy.y;
  } else {
    const cols = Math.floor((zone.right - zone.left) / GRID);
    const rows = Math.floor(city.height / GRID);
    gx = zone.left + Math.floor(Math.random() * cols) * GRID + GRID / 2;
    gy = Math.floor(Math.random() * rows) * GRID + GRID / 2;
  }

  g.iskanderWarn = { x: gx, y: gy, life: m.iskander.warnTicks };
  addLog(g, `🚀 ${getIskanderQuip('incoming')}`, {
    broadcast: { text: getBattleCalloutText('iskanderIncoming', g.mode), life: 68, priority: 3, color: '#fee2e2', accent: '#ef4444' },
  });
  playSiren();
}

function intercept(g, m) {
  const iw = g.iskanderWarn;
  const H = g.city.height;
  const W = g.city.width;

  // Patriot launches from random position along bottom edge
  const launchX = rnd(W * 0.15, W * 0.85);
  const launchY = H + 20;

  // Intercept point: slightly above target (Iskander is coming down)
  const interceptY = Math.max(30, iw.y - rnd(40, 80));

  const iskanderStartX = iw.x + rnd(-W * 0.14, W * 0.14);
  const iskanderStartY = -28;

  g.patriotAnim = {
    type: 'cinematicIntercept',
    freezeGameplay: true,
    tick: 0,
    flyTicks: PATRIOT_CINEMATIC_FLY_TICKS,
    totalTicks: PATRIOT_CINEMATIC_TOTAL_TICKS,
    bloomTicks: PATRIOT_CINEMATIC_BLOOM_TICKS,
    launchX,
    launchY,
    iskanderX: iskanderStartX,
    iskanderY: iskanderStartY,
    targetX: iw.x,
    targetY: interceptY,
    detonated: false,
  };

  addLog(g, '🛡️ Patriot виходить на перехоплення!', {
    broadcast: { text: getBattleCalloutText('patriotLaunch', g.mode), life: PATRIOT_CINEMATIC_TOTAL_TICKS + 14, priority: 3, color: '#e2e8f0', accent: '#60a5fa' },
  });
  playPatriotLaunch();

  g.iskanderWarn = null;
  g.iskanderTimer = rnd(m.iskander.interval[0], m.iskander.interval[1]);
}

function impact(g, m) {
  const iw = g.iskanderWarn;

  // Direct hit on towers
  const BUNKER_SNAP = 22;
  for (const tw of g.towers) {
    if (tw.hp <= 0) continue;
    const d = dist(tw, { x: iw.x, y: iw.y });
    // Bunker reduces Iskander damage by 50% (direct hit becomes survivable splash)
    const inBunker = g.city.terrainTiles?.some(t => t.type === 'bunker' && dist(tw, t) < BUNKER_SNAP);
    if (d < GRID * 0.6) {
      if (inBunker) {
        // Bunker absorbs direct hit: tower takes splash damage instead of instant death
        tw.hp = Math.max(1, tw.hp - Math.round(tw.maxHp * m.iskander.splashPct));
        addLog(g, '🛡️ Бліндаж витримав прямий удар!', {
          broadcast: { text: getBattleCalloutText('bunkerHold', g.mode), life: 52, priority: 2, color: '#e2e8f0', accent: '#fbbf24' },
        });
      } else {
        tw.hp = 0;
        if (tw.type === 'airfield') {
          g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== tw.id);
        }
        markUnitDestroyed(g, tw.id);
        addLog(g, `🚀 ${getIskanderQuip('hit')}`, {
          broadcast: { text: getBattleCalloutText('iskanderHit', g.mode), life: 60, priority: 3, color: '#fee2e2', accent: '#ef4444' },
        });
      }
    } else if (d < GRID * 1.6) {
      const splashDmg = Math.round(tw.maxHp * m.iskander.splashPct * (inBunker ? 0.5 : 1));
      tw.hp = Math.max(0, tw.hp - splashDmg);
      if (tw.hp <= 0) {
        markUnitDestroyed(g, tw.id);
        if (tw.type === 'airfield') g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== tw.id);
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

  // Damage nearby civilian buildings
  for (const cb of g.civilianBuildings) {
    if (cb.destroyed) continue;
    if (dist(cb, { x: iw.x, y: iw.y }) < GRID * 2) {
      cb.destroyed = true;
      g.civilianHits++;
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
