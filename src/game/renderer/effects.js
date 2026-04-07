// Visual effects: explosions, particles, floating text
export function drawEffects(ctx, g) {
  // Explosions
  for (const ex of g.explosions) {
    const a = ex.life / ex.ml;
    const pr = 1 - a;
    ctx.fillStyle = `rgba(251,191,36,${a * 0.5})`;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.r * pr + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(239,68,68,${a * 0.35})`;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, (ex.r * pr) * 0.5 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles
  for (const p of g.particles) {
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Floating text
  for (const f of g.floats) {
    ctx.globalAlpha = Math.min(1, (f.life / f.ml) * 2);
    ctx.font = "bold 9px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
