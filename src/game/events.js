// Random events: F-16, EW jamming, weather
import { TICK, rnd, uid } from './physics.js';
import { addLog } from './state.js';
import { playJetFlyby, playEWBuzz } from '../audio/SoundManager.js';
import { getF16Quip, getEWQuip } from '../data/battleQuips.js';
import { ENEMY_COLORS, ENEMY_SIZES } from '../data/enemies.js';
import { getSpawnPos, pickSpawnEdge } from '../data/cities.js';

// ====== F-16 VIPER ======

export function trySpawnF16(g) {
  if (g.wave < 4 || g.f16Cooldown > 0) return;
  // 12% chance per wave after wave 4
  if (Math.random() > 0.12) return;

  const W = g.city.width, H = g.city.height;
  // Fly from left to right at random height
  const y = rnd(H * 0.15, H * 0.5);
  g.f16 = {
    x: -60, y,
    speed: 12,
    missiles: 2,
    missileCooldown: 0,
    id: uid(),
    trail: [],
  };
  g.f16Cooldown = 3; // can't appear for next 3 waves
  addLog(g, `🛩️ ${getF16Quip('arrive')}`);
  playJetFlyby();
}

export function updateF16(g) {
  if (!g.f16) return;
  const f = g.f16;
  const W = g.city.width;

  f.x += f.speed * TICK;
  f.trail.push({ x: f.x, y: f.y });
  if (f.trail.length > 30) f.trail.shift();

  // Fire missiles at toughest enemies
  f.missileCooldown -= TICK;
  if (f.missiles > 0 && f.missileCooldown <= 0 && g.enemies.length > 0) {
    // Target highest HP enemy
    const target = g.enemies.reduce((best, e) => e.hp > (best?.hp || 0) ? e : best, null);
    if (target) {
      g.projectiles.push({
        x: f.x, y: f.y, tid: target.id, tx: target.x, ty: target.y,
        damage: 999, speed: 10, color: '#ffffff', id: uid(), hitChance: 0.92,
        isF16Missile: true,
      });
      f.missiles--;
      f.missileCooldown = 25;
      addLog(g, `🚀 ${getF16Quip('missile')}`);
    }
  }

  // Off screen = done
  if (f.x > W + 100) {
    g.f16 = null;
  }
}

export function drawF16(ctx, g) {
  if (!g.f16) return;
  const f = g.f16;

  // Contrail
  for (let i = 0; i < f.trail.length; i++) {
    const a = i / f.trail.length;
    ctx.fillStyle = `rgba(200,220,255,${a * 0.15})`;
    ctx.beginPath();
    ctx.arc(f.trail[i].x, f.trail[i].y, 2 + a * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Jet body
  ctx.save();
  ctx.translate(f.x, f.y);

  // Fuselage
  ctx.fillStyle = '#8899aa';
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-12, -4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-12, 4);
  ctx.closePath();
  ctx.fill();

  // Wings
  ctx.fillStyle = '#667788';
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-8, -14);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 12);
  ctx.lineTo(-8, 14);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.fillStyle = '#556677';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-18, -7);
  ctx.lineTo(-20, -6);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-20, 6);
  ctx.lineTo(-18, 7);
  ctx.closePath();
  ctx.fill();

  // Afterburner glow
  ctx.fillStyle = 'rgba(251,191,36,0.6)';
  ctx.beginPath();
  ctx.ellipse(-18, 0, 6 + Math.random() * 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ====== EW JAMMING ======

export function trySpawnEW(g) {
  if (g.ewActive || g.ewCooldown > 0) return;
  if (g.wave < 2) return;
  // 15% chance per wave
  if (Math.random() > 0.15) return;

  g.ewActive = { timer: rnd(400, 650), maxTimer: 650 };
  g.ewCooldown = 2;
  addLog(g, `📡 ${getEWQuip('start')}`);
  playEWBuzz();
}

export function updateEW(g) {
  if (!g.ewActive) return;
  g.ewActive.timer -= TICK;
  if (g.ewActive.timer <= 0) {
    g.ewActive = null;
    addLog(g, `📡 ${getEWQuip('end')}`);
  }
}

export function drawEWOverlay(ctx, g) {
  if (!g.ewActive) return;
  const W = g.city.width, H = g.city.height;
  const pulse = Math.sin(g.tick * 0.08) * 0.5 + 0.5;

  ctx.save();

  // Full-screen orange tint
  ctx.fillStyle = `rgba(245,158,11,${0.04 + pulse * 0.04})`;
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  ctx.strokeStyle = `rgba(245,158,11,${0.06 + pulse * 0.04})`;
  ctx.lineWidth = 1;
  const offset = g.tick % 8;
  for (let y = offset; y < H; y += 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Static noise particles
  ctx.globalAlpha = 0.12 + pulse * 0.08;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#fff';
    ctx.fillRect(x, y, rnd(1, 5), rnd(1, 3));
  }
  ctx.globalAlpha = 1;

  // Bold border
  const flash = Math.sin(g.tick * 0.15) > 0;
  ctx.strokeStyle = flash ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.15)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // Large centered label
  ctx.font = "bold 16px 'Courier New'";
  ctx.textAlign = 'center';
  ctx.fillStyle = flash ? '#f59e0b' : '#f59e0baa';
  ctx.fillText('⚡ ВОРОЖИЙ РЕБ ⚡', W / 2, 24);

  // Timer bar
  const progress = g.ewActive.timer / g.ewActive.maxTimer;
  ctx.fillStyle = '#f59e0b33';
  ctx.fillRect(W / 2 - 60, 30, 120, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(W / 2 - 60, 30, 120 * progress, 4);

  ctx.restore();
}

// Get EW multipliers for combat
export function getEWMultipliers(g) {
  if (!g.ewActive) return { fpvLossMul: 1, kukurznikAccMul: 1 };
  return {
    fpvLossMul: 3.0,      // FPV loses signal 3x more often
    kukurznikAccMul: 0.5,  // kukurznik accuracy halved
  };
}

// ====== Kh-101 AIR LAUNCH ======

export function trySpawnKh101(g) {
  if (g.wave < 5) return;
  const cfg = g.mode.kh101;
  if (!cfg) return;
  if (Math.random() > cfg.spawnChance) return;
  // Don't overlap with F-16 (both are flyby events)
  if (g.f16) return;

  const W = g.city.width, H = g.city.height;
  const count = rnd(cfg.count[0], cfg.count[1] + 1) | 0;

  addLog(g, '⚠️ Ту-95МС в повітрі! Пуск крилатих ракет!');

  // Spawn Kh-101s from one edge with slight delay
  const spawnY = rnd(H * 0.1, H * 0.4);
  for (let i = 0; i < count; i++) {
    const target = pickKh101Target(g);
    if (!target) continue;

    g.enemies.push({
      x: W + 30 + i * 25, // staggered from right edge
      y: spawnY + rnd(-30, 30),
      hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed,
      dmg: cfg.dmg,
      reward: cfg.reward,
      color: ENEMY_COLORS.kh101,
      sz: ENEMY_SIZES.kh101,
      type: 'kh101',
      target,
      id: uid(),
      angle: Math.PI,
      dodgeChance: 0,
    });

    g.totalSpawned++;
    g.spawnedByType.kh101++;
  }
}

function pickKh101Target(g) {
  const alive = g.buildings.filter(b => b.hp > 0);
  return alive.length
    ? { mode: 'building', key: alive[Math.floor(Math.random() * alive.length)].key }
    : null;
}

// ====== ORLAN-10 RECON ======

export function trySpawnOrlan(g) {
  if (g.wave < 2) return; // not on first 2 waves
  const orlanCfg = g.mode.orlan;
  if (!orlanCfg) return;
  if (Math.random() > orlanCfg.spawnChance) return;

  // Already an orlan in the air? skip
  if (g.enemies.some(e => e.type === 'orlan')) return;

  const W = g.city.width, H = g.city.height;
  const edge = pickSpawnEdge(g.city);
  const pos = getSpawnPos(g.city, edge);

  // Escape target: opposite side of the map
  let escX, escY;
  if (pos.x <= 0) { escX = W + 30; escY = rnd(H * 0.2, H * 0.8); }
  else if (pos.x >= W) { escX = -30; escY = rnd(H * 0.2, H * 0.8); }
  else if (pos.y <= 0) { escX = rnd(W * 0.2, W * 0.8); escY = H + 30; }
  else { escX = rnd(W * 0.2, W * 0.8); escY = -30; }

  g.enemies.push({
    x: pos.x, y: pos.y,
    hp: orlanCfg.hp, maxHp: orlanCfg.hp,
    speed: orlanCfg.speed,
    dmg: 0,
    reward: orlanCfg.reward,
    color: ENEMY_COLORS.orlan,
    sz: ENEMY_SIZES.orlan,
    type: 'orlan',
    target: { mode: 'escape', x: escX, y: escY },
    id: uid(),
    angle: Math.atan2(escY - pos.y, escX - pos.x),
    dodgeChance: 0,
  });

  g.totalSpawned++;
  if (g.spawnedByType.orlan === undefined) g.spawnedByType.orlan = 0;
  g.spawnedByType.orlan++;

  addLog(g, '👁️ Орлан-10 в повітрі! Розвідник — збийте його!');
}

// ====== WEATHER ======

const WEATHER_TYPES = [
  { id: 'clear', label: '☀️ Ясно', effects: {} },
  { id: 'clear', label: '☀️ Ясно', effects: {} }, // weighted: clear is more common
  { id: 'fog', label: '🌫️ Туман', effects: { rangeMul: 0.7 } },
  { id: 'night', label: '🌙 Ніч', effects: { turretAccMul: 0.8, visibility: 0.6 } },
  { id: 'wind', label: '💨 Вітер', effects: { accuracyMul: 0.85, drift: true } },
];

export function rollWeather() {
  return WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
}

export function drawWeatherOverlay(ctx, g) {
  const w = g.weather;
  if (!w || w.id === 'clear') return;

  ctx.save();
  if (w.id === 'fog') {
    // Fog overlay
    const fog = ctx.createRadialGradient(
      g.city.width / 2, g.city.height / 2, 100,
      g.city.width / 2, g.city.height / 2, g.city.width * 0.6
    );
    fog.addColorStop(0, 'rgba(180,190,200,0)');
    fog.addColorStop(1, 'rgba(180,190,200,0.15)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, g.city.width, g.city.height);
  } else if (w.id === 'night') {
    // Dark overlay with glow around buildings
    ctx.fillStyle = 'rgba(0,0,15,0.35)';
    ctx.fillRect(0, 0, g.city.width, g.city.height);
    // Glow around active buildings
    for (const b of g.buildings) {
      if (b.hp <= 0) continue;
      const glow = ctx.createRadialGradient(b.x, b.y, 5, b.x, b.y, 50);
      glow.addColorStop(0, 'rgba(251,191,36,0.1)');
      glow.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(b.x - 50, b.y - 50, 100, 100);
    }
  } else if (w.id === 'wind') {
    // Wind streaks
    ctx.strokeStyle = 'rgba(200,210,220,0.04)';
    ctx.lineWidth = 1;
    const offset = (g.tick * 2) % 60;
    for (let y = -20; y < g.city.height + 20; y += 30) {
      ctx.beginPath();
      ctx.moveTo(-20 + offset, y + Math.sin(y * 0.1) * 5);
      ctx.lineTo(g.city.width + 20, y + 10 + Math.sin(y * 0.1 + 2) * 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}
