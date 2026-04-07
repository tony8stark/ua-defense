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
