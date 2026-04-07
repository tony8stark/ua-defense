// Building rendering
export function drawBuildings(ctx, g) {
  for (const b of g.buildings) {
    const alive = b.hp > 0;

    ctx.fillStyle = alive ? '#1e3326' : '#2a1515';
    ctx.strokeStyle = alive ? '#4ade8066' : '#7f1d1d66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(b.x - 24, b.y - 24, 48, 48, 5);
    ctx.fill();
    ctx.stroke();

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alive ? 1 : 0.25;
    ctx.fillText(b.emoji, b.x, b.y - 1);
    ctx.globalAlpha = 1;

    if (alive) {
      const pct = b.hp / b.maxHp;
      ctx.fillStyle = '#0008';
      ctx.fillRect(b.x - 20, b.y + 19, 40, 4);
      ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(b.x - 20, b.y + 19, 40 * pct, 4);
    } else {
      ctx.font = "8px 'Courier New'";
      ctx.fillStyle = '#7f1d1d';
      ctx.fillText('ЗНИЩЕНО', b.x, b.y + 22);
    }

    ctx.font = "7px 'Courier New'";
    ctx.fillStyle = alive ? '#4ade8066' : '#7f1d1d55';
    ctx.fillText(b.name, b.x, b.y - 30);
  }
}
