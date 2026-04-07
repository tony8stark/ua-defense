// Main game update loop: orchestrates spawning, movement, combat, effects
import { TICK, dist, ang, rnd, chance } from './physics.js';
import { flatWave, spawnEnemy, retarget, getTargetPoint } from './spawner.js';
import { updateCombat } from './combat.js';
import { updateIskander } from './iskander.js';
import { trySpawnF16, updateF16, trySpawnEW, updateEW, rollWeather } from './events.js';
import { DEF_META } from '../data/units.js';
import { addLog } from './state.js';
import { playWaveComplete, playExplosion } from '../audio/SoundManager.js';

// Start a wave
export function startWave(g) {
  if (g.waveActive || g.wave >= g.mode.waves.length) return false;
  const waveDef = g.mode.waves[g.wave];
  g.spawnQueue = flatWave(waveDef);
  g.spawnTimer = 0;
  g.waveActive = true;
  g.waveDelay = waveDef.d;

  // Roll new weather for this wave
  g.weather = rollWeather();
  if (g.weather.id !== 'clear') {
    addLog(g, `${g.weather.label}`);
  }

  // Try spawn events at wave start
  trySpawnF16(g);
  trySpawnEW(g);

  return true;
}

// One game tick
export function update(g) {
  g.tick++;

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
    const bonus = g.mode.waveBonus + g.wave * 10;
    g.money += bonus;
    g.weather = rollWeather(); // reset weather between waves
    if (g.f16Cooldown > 0) g.f16Cooldown--;
    if (g.ewCooldown > 0) g.ewCooldown--;
    addLog(g, `Хвилю ${g.wave} відбито! +${bonus}💰`);
    playWaveComplete();
    if (g.wave >= g.mode.waves.length) return 'won';
  }

  // Move enemies toward targets
  for (const en of g.enemies) {
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
      to.hp = Math.max(0, to.hp - en.dmg);

      if (en.target.mode === 'tower') {
        const name = to.callsign ? `"${to.callsign}" (${DEF_META[to.type]?.name})` : DEF_META[to.type]?.name || 'Позицію';
        if (to.hp <= 0) {
          addLog(g, `⚠️ ${name} знищено!`);
          if (to.type === 'airfield') g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== to.id);
        }
      } else if (en.target.mode === 'building') {
        addLog(g, `💥 ${to.name} під ударом! (${to.hp}/${to.maxHp})`);
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

  // Combat
  updateCombat(g);
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
