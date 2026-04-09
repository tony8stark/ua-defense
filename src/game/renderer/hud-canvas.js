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

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t) {
  return t ** 3;
}

function drawBannerFrame(ctx, x, y, w, h, accent, alpha) {
  ctx.fillStyle = `rgba(10,15,26,${0.72 * alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = `rgba(148,163,184,${0.35 * alpha})`;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = `${accent}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  ctx.fillRect(x + 10, y + h - 6, w - 20, 2);
}

export function drawBattleCallout(ctx, g) {
  const callout = g.battleCallout;
  if (!callout) return;

  const lifePct = callout.life / callout.ml;
  const fadeIn = Math.min(1, (1 - lifePct) * 5);
  const fadeOut = Math.min(1, lifePct / 0.35);
  const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
  const width = Math.min(g.city.width - 80, Math.max(220, callout.text.length * 8 + 44));
  const x = (g.city.width - width) / 2;
  const y = 12;

  ctx.save();
  drawBannerFrame(ctx, x, y, width, 34, callout.accent, alpha);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "bold 12px 'Courier New'";
  ctx.fillStyle = callout.color;
  ctx.globalAlpha = alpha;
  ctx.fillText(callout.text, g.city.width / 2, y + 17);
  ctx.restore();
}

export function drawPatriotAnim(ctx, g) {
  const pa = g.patriotAnim;
  if (!pa) return;

  if (pa.type === 'cinematicIntercept') {
    const flyTicks = pa.flyTicks || 72;
    const totalTicks = pa.totalTicks || 92;
    const bloomTicks = pa.bloomTicks || Math.max(1, totalTicks - flyTicks);
    const t = pa.tick;
    const inFlight = Math.min(1, t / flyTicks);
    const patriotP = easeOutCubic(inFlight);
    const iskanderP = easeInCubic(inFlight);
    const patriotX = pa.launchX + (pa.targetX - pa.launchX) * patriotP;
    const patriotY = pa.launchY + (pa.targetY - pa.launchY) * patriotP;
    const iskanderX = pa.iskanderX + (pa.targetX - pa.iskanderX) * iskanderP;
    const iskanderY = pa.iskanderY + (pa.targetY - pa.iskanderY) * iskanderP;

    ctx.save();
    ctx.fillStyle = 'rgba(2,6,23,0.78)';
    ctx.fillRect(0, 0, g.city.width, g.city.height);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, g.city.width, 26);
    ctx.fillRect(0, g.city.height - 26, g.city.width, 26);

    ctx.strokeStyle = 'rgba(248,113,113,0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pa.iskanderX, pa.iskanderY);
    ctx.lineTo(pa.targetX, pa.targetY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(96,165,250,0.28)';
    ctx.beginPath();
    ctx.moveTo(pa.launchX, pa.launchY);
    ctx.lineTo(pa.targetX, pa.targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pa.targetX, pa.targetY, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pa.targetX - 22, pa.targetY);
    ctx.lineTo(pa.targetX + 22, pa.targetY);
    ctx.moveTo(pa.targetX, pa.targetY - 22);
    ctx.lineTo(pa.targetX, pa.targetY + 22);
    ctx.stroke();

    if (!pa.detonated) {
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const tailP = i / 10;
        const trailX = pa.launchX + (patriotX - pa.launchX) * tailP;
        const trailY = pa.launchY + (patriotY - pa.launchY) * tailP;
        ctx.fillStyle = `rgba(191,219,254,${(1 - tailP) * 0.22})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, 2 + (1 - tailP) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.translate(patriotX, patriotY);
      ctx.rotate(Math.atan2(pa.targetY - pa.launchY, pa.targetX - pa.launchX));
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -3);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-8, -1, 4, 2);
      ctx.restore();

      ctx.save();
      for (let i = 0; i < 9; i++) {
        const tailP = i / 9;
        const trailX = pa.iskanderX + (iskanderX - pa.iskanderX) * tailP;
        const trailY = pa.iskanderY + (iskanderY - pa.iskanderY) * tailP;
        ctx.fillStyle = `rgba(248,113,113,${(1 - tailP) * 0.18})`;
        ctx.fillRect(trailX - 1, trailY - 1, 2, 2);
      }
      ctx.translate(iskanderX, iskanderY);
      ctx.rotate(Math.atan2(pa.targetY - pa.iskanderY, pa.targetX - pa.iskanderX));
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-9, -1, 5, 2);
      ctx.restore();
    } else {
      const bloomProgress = Math.min(1, (t - flyTicks) / bloomTicks);
      const flash = Math.max(0, 1 - bloomProgress * 2.5);
      const radius = 18 + bloomProgress * 52;

      ctx.fillStyle = `rgba(255,255,255,${flash * 0.2})`;
      ctx.fillRect(0, 0, g.city.width, g.city.height);

      ctx.strokeStyle = `rgba(191,219,254,${0.9 - bloomProgress * 0.75})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pa.targetX, pa.targetY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(251,191,36,${0.65 - bloomProgress * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pa.targetX, pa.targetY, radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();

      const core = ctx.createRadialGradient(pa.targetX, pa.targetY, 0, pa.targetX, pa.targetY, 26 + radius * 0.35);
      core.addColorStop(0, `rgba(255,255,255,${0.22 - bloomProgress * 0.15})`);
      core.addColorStop(0.45, `rgba(251,191,36,${0.18 - bloomProgress * 0.12})`);
      core.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = core;
      ctx.fillRect(pa.targetX - 80, pa.targetY - 80, 160, 160);
    }

    ctx.font = "bold 10px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(226,232,240,0.72)';
    ctx.fillText('FOCUS: PATRIOT VS ІСКАНДЕР', g.city.width / 2, 16);
    ctx.restore();
    return;
  }

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
  const accent = hover.valid ? mc.color : '#ef4444';

  // Range circle
  ctx.beginPath();
  ctx.arc(hover.x, hover.y, def.range, 0, Math.PI * 2);
  ctx.fillStyle = `${accent}08`;
  ctx.fill();
  ctx.strokeStyle = `${accent}35`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = hover.valid ? `${mc.color}12` : 'rgba(239,68,68,0.14)';
  ctx.fillRect(hover.x - 42, hover.y - 42, 84, 84);
  ctx.strokeStyle = hover.valid ? `${mc.color}35` : 'rgba(239,68,68,0.45)';
  ctx.strokeRect(hover.x - 42, hover.y - 42, 84, 84);

  // Unit preview
  ctx.fillStyle = hover.valid ? `${mc.color}30` : 'rgba(239,68,68,0.28)';
  ctx.beginPath();
  ctx.arc(hover.x, hover.y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mc.emoji, hover.x, hover.y);
}
