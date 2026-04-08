// In-canvas HUD elements (Iskander warning, hover preview)
import { GRID } from '../../data/cities.js';
import { DEF_META } from '../../data/units.js';

export function drawIskanderWarning(ctx, g) {
  const iw = g.iskanderWarn;
  if (!iw) return;

  const warnTicks = g.mode?.iskander?.warnTicks || 90;
  const progress = 1 - iw.life / warnTicks;
  const flash = Math.sin(g.tick * 0.3) > 0;

  // Danger zone
  ctx.fillStyle = flash ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.05)';
  ctx.beginPath();
  ctx.arc(iw.x, iw.y, GRID * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Crosshair
  ctx.strokeStyle = flash ? '#ef4444' : '#ef444466';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(iw.x - 18, iw.y); ctx.lineTo(iw.x + 18, iw.y);
  ctx.moveTo(iw.x, iw.y - 18); ctx.lineTo(iw.x, iw.y + 18);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(iw.x, iw.y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(iw.x, iw.y, 6, 0, Math.PI * 2); ctx.stroke();

  // Countdown ring
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(iw.x, iw.y, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.font = "bold 10px 'Courier New'";
  ctx.textAlign = 'center';
  ctx.fillStyle = flash ? '#ef4444' : '#ef444488';
  ctx.fillText('ІСКАНДЕР', iw.x, iw.y - 28);
}

const PATRIOT_RISE_TICKS = 55;
const PATRIOT_TOTAL_TICKS = 55 + 65;

export function drawPatriotAnim(ctx, g) {
  const pa = g.patriotAnim;
  if (!pa) return;

  const t = pa.tick;
  const { launchX, launchY, targetX, targetY } = pa;

  if (t < PATRIOT_RISE_TICKS) {
    // === RISING PHASE: missile flying toward intercept point ===
    const progress = t / PATRIOT_RISE_TICKS;
    // Ease-out for deceleration feel
    const ep = 1 - (1 - progress) * (1 - progress);
    const mx = launchX + (targetX - launchX) * ep;
    const my = launchY + (targetY - launchY) * ep;
    const angle = Math.atan2(targetY - launchY, targetX - launchX);

    // Trail: white fading line from launch to current
    ctx.save();
    const trailSteps = 12;
    for (let i = 0; i < trailSteps; i++) {
      const tp = i / trailSteps * progress;
      const tep = 1 - (1 - tp) * (1 - tp);
      const tx = launchX + (targetX - launchX) * tep;
      const ty = launchY + (targetY - launchY) * tep;
      const alpha = (1 - i / trailSteps) * 0.4 * progress;
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, 2 + (1 - i / trailSteps) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exhaust glow
    const glowR = 8 + Math.random() * 4;
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, glowR);
    glow.addColorStop(0, 'rgba(255,200,50,0.6)');
    glow.addColorStop(0.5, 'rgba(255,100,30,0.3)');
    glow.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mx - glowR, my - glowR, glowR * 2, glowR * 2);

    // Missile body
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -3);
    ctx.lineTo(-5, 3);
    ctx.closePath();
    ctx.fill();
    // Fins
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // "PATRIOT" label near missile
    if (progress > 0.2) {
      ctx.save();
      ctx.font = "bold 9px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(96,165,250,${Math.min(1, progress * 2)})`;
      ctx.fillText('PATRIOT', mx, mx < targetX ? my + 18 : my - 12);
      ctx.restore();
    }

  } else {
    // === EXPLOSION PHASE: air burst ===
    const explodeT = t - PATRIOT_RISE_TICKS;
    const explodeProgress = explodeT / (PATRIOT_TOTAL_TICKS - PATRIOT_RISE_TICKS);

    // Screen flash at start of explosion
    if (explodeT < 5) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.15 * (1 - explodeT / 5)})`;
      ctx.fillRect(0, 0, g.city.width, g.city.height);
      ctx.restore();
    }

    // Expanding rings
    const maxR = 55;
    const r = maxR * Math.min(1, explodeProgress * 2);
    const alpha = Math.max(0, 1 - explodeProgress);

    ctx.save();
    // Outer ring (white)
    ctx.strokeStyle = `rgba(200,220,255,${alpha * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring (yellow)
    ctx.strokeStyle = `rgba(251,191,36,${alpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Core glow (fading)
    if (explodeProgress < 0.5) {
      const coreAlpha = (1 - explodeProgress * 2) * 0.4;
      const coreR = 20 * (1 - explodeProgress);
      const core = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, coreR);
      core.addColorStop(0, `rgba(255,255,255,${coreAlpha})`);
      core.addColorStop(0.4, `rgba(251,191,36,${coreAlpha * 0.6})`);
      core.addColorStop(1, `rgba(251,191,36,0)`);
      ctx.fillStyle = core;
      ctx.fillRect(targetX - coreR, targetY - coreR, coreR * 2, coreR * 2);
    }

    // "ПЕРЕХОПЛЕНО" label
    if (explodeProgress < 0.7) {
      const labelAlpha = Math.min(1, explodeProgress * 3) * (1 - explodeProgress / 0.7);
      ctx.font = "bold 11px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(96,165,250,${labelAlpha})`;
      ctx.fillText('ПЕРЕХОПЛЕНО', targetX, targetY - 30 - explodeProgress * 20);
    }

    ctx.restore();
  }
}

export function drawHoverPreview(ctx, hover, selectedType, mode) {
  if (!hover) return;
  const def = mode[selectedType];
  const mc = DEF_META[selectedType];

  // Range circle
  ctx.beginPath();
  ctx.arc(hover.x, hover.y, def.range, 0, Math.PI * 2);
  ctx.fillStyle = `${mc.color}08`;
  ctx.fill();
  ctx.strokeStyle = `${mc.color}25`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Unit preview
  ctx.fillStyle = `${mc.color}30`;
  ctx.beginPath();
  ctx.arc(hover.x, hover.y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mc.emoji, hover.x, hover.y);
}
