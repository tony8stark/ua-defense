// Terrain rendering per city type
import { GRID } from '../../data/cities.js';

export function drawTerrain(ctx, g) {
  const city = g.city;
  const W = city.width, H = city.height;
  const t = g.tick * 0.02;

  if (city.terrain === 'coastal') {
    drawCoastalTerrain(ctx, W, H, city.landX, city.placeZone, t);
  } else if (city.terrain === 'urban') {
    drawUrbanTerrain(ctx, W, H, city.placeZone, t);
  }
}

function drawCoastalTerrain(ctx, W, H, landX, zone, t) {
  // Sea
  const sg = ctx.createLinearGradient(landX, 0, W, 0);
  sg.addColorStop(0, '#0f2b3d');
  sg.addColorStop(0.4, '#0c3350');
  sg.addColorStop(1, '#0a1628');
  ctx.fillStyle = sg;
  ctx.fillRect(landX, 0, W - landX, H);

  // Sea waves
  ctx.strokeStyle = 'rgba(56,189,248,0.06)';
  ctx.lineWidth = 1;
  for (let row = 0; row < H; row += 28) {
    ctx.beginPath();
    for (let x = landX; x < W; x += 4) {
      const y = row + Math.sin((x + t * 30) * 0.03) * 5;
      x === landX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Land
  const lg = ctx.createLinearGradient(0, 0, landX, 0);
  lg.addColorStop(0, '#1a2a1a');
  lg.addColorStop(0.8, '#142018');
  lg.addColorStop(1, '#0f1a14');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, landX, H);

  // Coastline
  ctx.strokeStyle = '#2d5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 0; y < H; y += 2) {
    const x = landX + Math.sin(y * 0.02 + t) * 6;
    y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Shore glow
  ctx.strokeStyle = 'rgba(56,189,248,0.08)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let y = 0; y < H; y += 2) {
    const x = landX + Math.sin(y * 0.02 + t + 1) * 8 + 5;
    y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Grid
  drawGrid(ctx, zone.left, zone.right + 10, H);
}

function drawUrbanTerrain(ctx, W, H, zone, t) {
  // Dark city background
  const bg = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, '#1a1f2e');
  bg.addColorStop(0.6, '#141822');
  bg.addColorStop(1, '#0c1018');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Dnipro river (runs roughly north-south on the right third)
  ctx.save();
  ctx.globalAlpha = 0.3;
  const riverX = W * 0.72;
  const rg = ctx.createLinearGradient(riverX - 30, 0, riverX + 30, 0);
  rg.addColorStop(0, 'transparent');
  rg.addColorStop(0.3, '#0f2b3d');
  rg.addColorStop(0.5, '#0c3350');
  rg.addColorStop(0.7, '#0f2b3d');
  rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg;
  ctx.beginPath();
  for (let y = 0; y <= H; y += 2) {
    const x = riverX + Math.sin(y * 0.008 + t * 0.5) * 20;
    if (y === 0) ctx.moveTo(x + 25, y);
    else ctx.lineTo(x + 25, y);
  }
  for (let y = H; y >= 0; y -= 2) {
    const x = riverX + Math.sin(y * 0.008 + t * 0.5) * 20;
    ctx.lineTo(x - 25, y);
  }
  ctx.fill();
  ctx.restore();

  // Subtle road grid
  ctx.strokeStyle = 'rgba(100,116,139,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID * 3) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += GRID * 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Placement grid
  drawGrid(ctx, zone.left, zone.right, H);
}

function drawGrid(ctx, left, right, H) {
  ctx.strokeStyle = 'rgba(74,222,128,0.035)';
  ctx.lineWidth = 0.5;
  for (let x = left; x <= right; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += GRID) {
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
  }
}
