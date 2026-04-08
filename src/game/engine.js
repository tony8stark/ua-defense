// Main game update loop: orchestrates spawning, movement, combat, effects
import { TICK, dist, ang, rnd, chance, updateTick } from './physics.js';
import { flatWave, spawnEnemy, retarget, getTargetPoint } from './spawner.js';
import { updateCombat } from './combat.js';
import { updateIskander } from './iskander.js';
import { trySpawnF16, updateF16, trySpawnEW, updateEW, trySpawnOrlan, trySpawnKh101, rollWeather } from './events.js';
import { shouldRevealStealthEnemy } from './stealth.js';
import { getWaveDef, hasMoreWaves } from './waves.js';
import { DEF_META } from '../data/units.js';
import { addLog, markUnitDestroyed, updateCombo, updateTrivoga, getBuildingBonuses } from './state.js';
import { playWaveComplete, playExplosion } from '../audio/SoundManager.js';
import { getWaveStartQuip, getWaveCompleteQuip, getWeatherQuip, getIntelQuip } from '../data/battleQuips.js';

const ENEMY_SHORT = {
  shahed: 'Шхд', shahed238: '238', geran: 'Гер', lancet: 'Лнц',
  guided: 'Кер', kalibr: 'Клб', kh101: 'Кх', orlan: 'Орл',
};

// Start a wave
export function startWave(g) {
  if (g.waveActive || !hasMoreWaves(g.mode, g.wave)) return false;
  const waveDef = getWaveDef(g.mode, g.wave, g.city);
  if (!waveDef) return false;
  g.spawnQueue = flatWave(waveDef);
  g.spawnTimer = 0;
  g.waveActive = true;
  g.waveDelay = waveDef.d;

  // Apply Orlan recon buff (if any)
  if (g.nextWaveBuff > 1.0) {
    g._waveBuff = g.nextWaveBuff;
    addLog(g, `⚠️ Ворог використав розвідку! HP ворогів x${g.nextWaveBuff.toFixed(1)}`);
    g.nextWaveBuff = 1.0;
  } else {
    g._waveBuff = 1.0;
  }

  // Roll new weather for this wave
  g.weather = rollWeather();
  if (g.weather.id !== 'clear') {
    const wq = getWeatherQuip(g.weather.id);
    addLog(g, wq || g.weather.label);
  }

  addLog(g, getWaveStartQuip());

  // Track wave size for mid-wave events
  g._waveSize = g.spawnQueue.length;
  g._ewRolled = false;

  // Try spawn events at wave start (EW triggers mid-wave now, not here)
  trySpawnF16(g);
  trySpawnOrlan(g);
  trySpawnKh101(g);

  return true;
}

// One game tick
export function update(g) {
  g.tick++;
  updateTick(g);

  // Spawn enemies from queue
  if (g.waveActive && g.spawnQueue.length > 0) {
    g.spawnTimer -= TICK;
    if (g.spawnTimer <= 0) {
      spawnEnemy(g, g.spawnQueue.shift());
      g.spawnTimer = g.waveDelay;
    }
  }

  // Wave complete check
  if (g.waveActive && g.spawnQueue.length === 0 && g.enemies.length === 0) {
    g.waveActive = false;
    g.wave++;
    const bb = getBuildingBonuses(g);
    const bonus = g.mode.waveBonus + g.wave * 10 + bb.waveBonus;
    g.money += bonus;
    g.weather = rollWeather(); // reset weather between waves
    if (g.f16Cooldown > 0) g.f16Cooldown--;
    if (g.ewCooldown > 0) g.ewCooldown--;
    g.trivogaCooldown = 0; // Reset Тривога cooldown between waves
    addLog(g, `${getWaveCompleteQuip()} +${bonus}💰`);
    // Intel: show approximate composition of next wave
    if (hasMoreWaves(g.mode, g.wave)) {
      setTimeout(() => {
        addLog(g, getIntelQuip());
        // Show fuzzy enemy count breakdown
        const next = getWaveDef(g.mode, g.wave, g.city);
        if (next) {
          const isHell = g.mode.iskander.interval[0] < 600;
          const fuzz = isHell ? 0.4 : 0.2;
          const parts = next.en
            .filter(e => !(e.t === 'kalibr' && g.city.id !== 'odesa'))
            .map(e => {
              const approx = Math.max(1, Math.round(e.n * (1 + (Math.random() * 2 - 1) * fuzz)));
              return `${ENEMY_SHORT[e.t] || e.t}:~${approx}`;
            });
          addLog(g, `📋 Прогноз: ${parts.join(' ')}`);
        }
      }, 1500);
    }
    playWaveComplete();
    if (!hasMoreWaves(g.mode, g.wave)) return 'won';
  }

  // Reveal low-flying targets only once they are almost over the objective
  // or already inside a very tight point-defense bubble.
  for (const en of g.enemies) {
    if (en.stealth && shouldRevealStealthEnemy(g, en)) {
      en.stealth = false;
      addLog(g, '⚠️ Низьколітна ціль виявлена!');
      // Visual pop effect
      g.floats.push({ x: en.x, y: en.y - 16, text: '👁️ ВИЯВЛЕНО', color: '#fbbf24', life: 50, ml: 50 });
    }
  }

  // Update altitude cycling for Shaheds
  for (const en of g.enemies) {
    if (!en.altCycle) continue;
    en.altTimer -= TICK;
    if (en.altTimer <= 0) {
      if (en.altitude === 'climbing') {
        en.altitude = 'high';
        en.altTimer = rnd(80, 150); // stay high for a while
      } else if (en.altitude === 'high') {
        en.altitude = 'diving';
        en.altTimer = rnd(30, 60);
      } else if (en.altitude === 'diving') {
        en.altitude = 'low';
        en.altTimer = rnd(60, 120); // stay low for a while
      } else {
        en.altitude = 'climbing';
        en.altTimer = rnd(40, 80);
      }
    }
  }

  // Move enemies toward targets
  for (const en of g.enemies) {
    // Orlan recon: flies straight to escape point, no retarget
    if (en.type === 'orlan') {
      const esc = en.target;
      const a = ang(en, { x: esc.x, y: esc.y });
      en.x += Math.cos(a) * en.speed * TICK;
      en.y += Math.sin(a) * en.speed * TICK;
      en.angle = a;
      // Check if escaped (reached target area)
      if (dist(en, { x: esc.x, y: esc.y }) < 30) {
        const buffPct = g.mode.orlan?.waveBuff || 0.25;
        g.nextWaveBuff += buffPct;
        g.orlanEscapes++;
        addLog(g, `⚠️ Орлан пройшов! Наступна хвиля +${Math.round(buffPct * 100)}%`);
        en.hp = 0;
      }
      continue;
    }

    let to = getTargetPoint(g, en.target);
    if (!to) { retarget(g, en); to = getTargetPoint(g, en.target); }
    if (!to) continue;

    // Guided drones actively retarget nearest tower each tick
    if (en.type === 'guided' && g.tick % 20 === 0) {
      retarget(g, en);
      to = getTargetPoint(g, en.target) || to;
    }

    const a = ang(en, to);

    // Wind drift
    let driftX = 0, driftY = 0;
    if (g.weather?.effects?.drift) {
      driftX = Math.sin(g.tick * 0.05 + en.id * 3) * 0.3;
      driftY = Math.cos(g.tick * 0.03 + en.id * 7) * 0.15;
    }

    // Guided drones zigzag
    if (en.type === 'guided') {
      const zigzag = Math.sin(g.tick * 0.12 + en.id * 3) * 1.5;
      driftX += Math.cos(a + Math.PI / 2) * zigzag;
      driftY += Math.sin(a + Math.PI / 2) * zigzag;
    }

    en.x += (Math.cos(a) * en.speed + driftX) * TICK;
    en.y += (Math.sin(a) * en.speed + driftY) * TICK;
    en.angle = a;

    if (dist(en, to) < 28) {
      // High-altitude attack: 30% chance to miss target entirely (inaccurate dive)
      const isHighAttack = en.altitude === 'high' || en.altitude === 'climbing';
      if (isHighAttack && chance(0.30)) {
        addLog(g, '💨 Шахед промахнувся з висоти!');
        g.floats.push({ x: en.x, y: en.y - 16, text: 'ПРОМАХ З ВИСОТИ', color: '#64748b', life: 45, ml: 45 });
        en.hp = 0;
        g.explosions.push({ x: en.x + rnd(-30, 30), y: en.y + rnd(-30, 30), r: 18, life: 20, ml: 20 });
        continue;
      }
      // High-altitude attack that hits: -30% damage
      const altDmgMul = isHighAttack ? 0.70 : 1.0;
      to.hp = Math.max(0, to.hp - Math.round(en.dmg * altDmgMul));

      if (en.target.mode === 'tower') {
        const name = to.callsign ? `"${to.callsign}" (${DEF_META[to.type]?.name})` : DEF_META[to.type]?.name || 'Позицію';
        if (to.hp <= 0) {
          addLog(g, `⚠️ ${name} знищено!`);
          markUnitDestroyed(g, to.id);
          if (to.type === 'airfield') g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== to.id);
        }
      } else if (en.target.mode === 'building') {
        addLog(g, `💥 ${to.name} під ударом! (${to.hp}/${to.maxHp})`);
      }

      // Damage nearby civilian buildings (splash)
      for (const cb of g.civilianBuildings) {
        if (cb.destroyed) continue;
        if (dist(en, cb) < 40) {
          cb.destroyed = true;
          g.civilianHits++;
          g.floats.push({ x: cb.x, y: cb.y - 10, text: '🏚️', color: '#ef4444', life: 50, ml: 50 });
        }
      }

      g.explosions.push({ x: en.x, y: en.y, r: 28, life: 28, ml: 28 });
      for (let i = 0; i < 8; i++) {
        g.particles.push({ x: en.x, y: en.y, vx: rnd(-2.5, 2.5), vy: rnd(-2.5, 2.5), life: rnd(15, 35), color: '#f59e0b' });
      }
      playExplosion(true);
      en.hp = 0;

      if (g.buildings.every(b => b.hp <= 0)) return 'lost';
    }
  }

  g.enemies = g.enemies.filter(e => e.hp > 0);
  g.towers = g.towers.filter(t => t.hp > 0 || (t.deathTimer || 0) > 0);

  // MVG patrol movement
  for (const tw of g.towers) {
    if (tw.type === 'mvg' && tw.hp > 0 && tw.originX !== undefined) {
      const pr = tw.patrolRange || 56;
      const phase = g.tick * 0.03 + (tw.patrolSeed || 0);
      tw.x = tw.originX + Math.cos(tw.patrolAngle) * Math.sin(phase) * pr;
      tw.y = tw.originY + Math.sin(tw.patrolAngle) * Math.sin(phase) * pr;
    }
  }

  // Combat
  updateCombat(g);
  updateCombo(g);
  updateTrivoga(g);

  // Mid-wave EW check
  trySpawnEW(g);
  g.enemies = g.enemies.filter(e => e.hp > 0);

  // Iskander
  updateIskander(g);

  // F-16
  updateF16(g);

  // EW
  updateEW(g);

  // Effects decay
  for (const ex of g.explosions) ex.life--;
  g.explosions = g.explosions.filter(e => e.life > 0);

  for (const p of g.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--; }
  g.particles = g.particles.filter(p => p.life > 0);

  for (const f of g.floats) { f.y -= 0.4; f.life--; }
  g.floats = g.floats.filter(f => f.life > 0);

  return null;
}
