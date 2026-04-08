// Terrain rendering per city type
import { GRID } from '../../data/cities.js';

export function drawTerrain(ctx, g) {
  const city = g.city;
  const W = city.width, H = city.height;
  const t = g.tick * 0.02;

  if (city.terrain === 'coastal-portrait') {
    drawCoastalPortrait(ctx, W, H, city.landY || 200, city.placeZone, t);
  } else if (city.terrain === 'coastal') {
    drawCoastalTerrain(ctx, W, H, city.landX, city.placeZone, t);
  } else if (city.terrain === 'urban') {
    drawUrbanTerrain(ctx, W, H, city.placeZone, t);
  }

  // Draw terrain tiles (elevation, bunker)
  if (city.terrainTiles) {
    drawTerrainTiles(ctx, city.terrainTiles);
  }
}

function drawTerrainTiles(ctx, tiles) {
  for (const tile of tiles) {
    ctx.save();
    if (tile.type === 'elevation') {
      // Raised area: lighter patch with contour arcs
      const rg = ctx.createRadialGradient(tile.x, tile.y, 4, tile.x, tile.y, 26);
      rg.addColorStop(0, 'rgba(74,222,128,0.10)');
      rg.addColorStop(0.7, 'rgba(74,222,128,0.04)');
      rg.addColorStop(1, 'rgba(74,222,128,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tile.x, tile.y, 26, 0, Math.PI * 2);
      ctx.fill();
      // Contour lines
      ctx.strokeStyle = 'rgba(74,222,128,0.12)';
      ctx.lineWidth = 0.7;
      for (let r = 12; r <= 24; r += 6) {
        ctx.beginPath();
        ctx.arc(tile.x, tile.y, r, -0.6, 2.2);
        ctx.stroke();
      }
      // Label
      ctx.font = "7px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(74,222,128,0.35)';
      ctx.fillText('▲ ' + tile.label, tile.x, tile.y - 28);
    } else if (tile.type === 'bunker') {
      // Fortified position: dark rectangular shelter
      ctx.fillStyle = 'rgba(100,116,139,0.12)';
      ctx.fillRect(tile.x - 16, tile.y - 10, 32, 20);
      ctx.fillRect(tile.x - 10, tile.y - 14, 20, 28);
      // Reinforcement lines
      ctx.strokeStyle = 'rgba(100,116,139,0.18)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(tile.x - 18, tile.y - 12, 36, 24);
      ctx.setLineDash([]);
      // Label
      ctx.font = "7px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(148,163,184,0.35)';
      ctx.fillText('\u26E8 ' + tile.label, tile.x, tile.y - 18);
    }
    ctx.restore();
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
  // Dark city background with warmer tone
  const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, '#1c1f2e');
  bg.addColorStop(0.5, '#151822');
  bg.addColorStop(1, '#0c1018');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Scattered building silhouettes (background detail)
  ctx.fillStyle = 'rgba(30,40,55,0.5)';
  const bldgSeed = [
    [120, 80, 30, 50], [200, 60, 25, 70], [760, 100, 35, 55], [820, 70, 20, 60],
    [140, 420, 28, 45], [80, 350, 22, 65], [800, 400, 30, 50], [750, 470, 25, 40],
    [300, 520, 20, 35], [620, 530, 24, 38], [680, 60, 20, 48],
  ];
  for (const [bx, by, bw, bh] of bldgSeed) {
    ctx.fillRect(bx, by, bw, bh);
  }
  // Windows (tiny lit dots on buildings)
  ctx.fillStyle = 'rgba(251,191,36,0.08)';
  for (const [bx, by, bw, bh] of bldgSeed) {
    for (let wx = bx + 4; wx < bx + bw - 4; wx += 7) {
      for (let wy = by + 6; wy < by + bh - 4; wy += 8) {
        if (Math.sin(wx * 13.7 + wy * 7.3) > 0.2) {
          ctx.fillRect(wx, wy, 2, 2);
        }
      }
    }
  }

  // Major roads (wider, slightly brighter)
  ctx.strokeStyle = 'rgba(100,116,139,0.10)';
  ctx.lineWidth = 2;
  // Horizontal main road
  ctx.beginPath(); ctx.moveTo(0, H * 0.47); ctx.lineTo(W, H * 0.47); ctx.stroke();
  // Vertical main road
  ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
  // Diagonal avenue (Khreshchatyk-like)
  ctx.strokeStyle = 'rgba(100,116,139,0.07)';
  ctx.beginPath(); ctx.moveTo(W * 0.3, 0); ctx.lineTo(W * 0.6, H); ctx.stroke();

  // Minor road grid
  ctx.strokeStyle = 'rgba(100,116,139,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID * 2) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += GRID * 2) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Dnipro river (wide, animated, visible)
  const riverX = W * 0.76;
  const riverW = 40;
  // River body
  ctx.save();
  const rg = ctx.createLinearGradient(riverX - riverW, 0, riverX + riverW, 0);
  rg.addColorStop(0, 'rgba(12,35,60,0)');
  rg.addColorStop(0.2, 'rgba(15,43,61,0.6)');
  rg.addColorStop(0.5, 'rgba(12,51,80,0.7)');
  rg.addColorStop(0.8, 'rgba(15,43,61,0.6)');
  rg.addColorStop(1, 'rgba(12,35,60,0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  for (let y = 0; y <= H; y += 2) {
    const x = riverX + Math.sin(y * 0.006 + t * 0.4) * 15;
    if (y === 0) ctx.moveTo(x + riverW, y);
    else ctx.lineTo(x + riverW, y);
  }
  for (let y = H; y >= 0; y -= 2) {
    const x = riverX + Math.sin(y * 0.006 + t * 0.4) * 15;
    ctx.lineTo(x - riverW, y);
  }
  ctx.fill();
  // River waves
  ctx.strokeStyle = 'rgba(56,189,248,0.07)';
  ctx.lineWidth = 1;
  for (let row = 0; row < H; row += 22) {
    ctx.beginPath();
    for (let x = riverX - riverW; x < riverX + riverW; x += 3) {
      const y = row + Math.sin((x + t * 20) * 0.04) * 3;
      x === riverX - riverW ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Spawn direction indicators (subtle arrows at edges)
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ef4444';
  // Top edge arrows
  for (let x = W * 0.2; x < W * 0.8; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x - 6, -2); ctx.lineTo(x - 3, 8);
    ctx.lineTo(x + 3, 8); ctx.lineTo(x + 6, -2); ctx.closePath(); ctx.fill();
  }
  // Right edge arrows
  for (let y = H * 0.1; y < H * 0.9; y += 80) {
    ctx.beginPath();
    ctx.moveTo(W, y); ctx.lineTo(W + 2, y - 6); ctx.lineTo(W - 8, y - 3);
    ctx.lineTo(W - 8, y + 3); ctx.lineTo(W + 2, y + 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Placement grid
  drawGrid(ctx, zone.left, zone.right, H);
}

// Portrait coastal: sea on top, land below
function drawCoastalPortrait(ctx, W, H, landY, zone, t) {
  // Sea (top band)
  const sg = ctx.createLinearGradient(0, 0, 0, landY);
  sg.addColorStop(0, '#0a1628');
  sg.addColorStop(0.5, '#0c3350');
  sg.addColorStop(1, '#0f2b3d');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, landY);

  // Sea waves
  ctx.strokeStyle = 'rgba(56,189,248,0.06)';
  ctx.lineWidth = 1;
  for (let col = 0; col < W; col += 28) {
    ctx.beginPath();
    for (let y = 0; y < landY; y += 4) {
      const x = col + Math.sin((y + t * 30) * 0.03) * 5;
      y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Land (below)
  const lg = ctx.createLinearGradient(0, landY, 0, H);
  lg.addColorStop(0, '#0f1a14');
  lg.addColorStop(0.2, '#142018');
  lg.addColorStop(1, '#1a2a1a');
  ctx.fillStyle = lg;
  ctx.fillRect(0, landY, W, H - landY);

  // Shoreline (horizontal)
  ctx.strokeStyle = '#2d5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < W; x += 2) {
    const y = landY + Math.sin(x * 0.02 + t) * 6;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Shore glow
  ctx.strokeStyle = 'rgba(56,189,248,0.08)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = 0; x < W; x += 2) {
    const y = landY + Math.sin(x * 0.02 + t + 1) * 8 - 5;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Grid on land area
  const top = zone.top || landY + 10;
  const bottom = zone.bottom || H;
  ctx.strokeStyle = 'rgba(74,222,128,0.035)';
  ctx.lineWidth = 0.5;
  for (let x = zone.left; x <= zone.right; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
  }
  for (let y = top; y <= bottom; y += GRID) {
    ctx.beginPath(); ctx.moveTo(zone.left, y); ctx.lineTo(zone.right, y); ctx.stroke();
  }
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
