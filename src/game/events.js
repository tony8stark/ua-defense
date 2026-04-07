// Random events: F-16, EW jamming, weather
import { TICK, rnd, uid } from './physics.js';
import { addLog } from './state.js';
import { playJetFlyby, playEWBuzz } from '../audio/SoundManager.js';

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
  addLog(g, '🛩️ F-16 Viper на підході!');
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
      addLog(g, '🚀 AIM-120 пущено!');
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
  addLog(g, '📡 ВОРОЖИЙ РЕБ! Зв\'язок порушено!');
  playEWBuzz();
}

export function updateEW(g) {
  if (!g.ewActive) return;
  g.ewActive.timer -= TICK;
  if (g.ewActive.timer <= 0) {
    g.ewActive = null;
    addLog(g, '📡 Ворожий РЕБ деактивовано');
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
