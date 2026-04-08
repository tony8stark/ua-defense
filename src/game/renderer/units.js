// Tower, kukurzniki, FPV drone rendering with SVG sprites
import { DEF_META } from '../../data/units.js';
import { TOWER_SPRITES, drawSprite } from '../../data/sprites.js';

const SYNERGY_RANGE = 56;

export function drawTowers(ctx, g) {
  // Draw synergy links first (behind towers)
  const alive = g.towers.filter(t => t.hp > 0 && t.type !== 'decoy');
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      if (a.type !== b.type) {
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (d < SYNERGY_RANGE) {
          ctx.strokeStyle = '#4ade8012';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }

  for (const tw of g.towers) {
    const mc = DEF_META[tw.type];
    const isAlive = tw.hp > 0;
    const alpha = isAlive ? 1 : Math.max(0, (tw.deathTimer || 0) / 30);

    ctx.globalAlpha = alpha;

    const sprite = TOWER_SPRITES[tw.type];
    if (isAlive && sprite && sprite.complete) {
      // Draw sprite (towers don't rotate except barrel direction shown by gun line)
      drawSprite(ctx, sprite, tw.x, tw.y, 0, 0.75);

      // Gun barrel direction (for turret-type towers)
      if (tw.type !== 'airfield' && tw.type !== 'decoy') {
        ctx.save();
        ctx.translate(tw.x, tw.y);
        ctx.rotate(tw.angle);
        ctx.fillStyle = mc.color;
        ctx.fillRect(6, -1.5, 10, 3);
        ctx.restore();
      }
    } else {
      // Death/fallback: original rendering
      ctx.fillStyle = isAlive ? '#1a2e1e' : '#2a1515';
      ctx.strokeStyle = isAlive ? mc.color + '88' : '#7f1d1d88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tw.x, tw.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (tw.type !== 'airfield' && isAlive) {
        ctx.save();
        ctx.translate(tw.x, tw.y);
        ctx.rotate(tw.angle);
        ctx.fillStyle = mc.color;
        ctx.fillRect(0, -1.5, 12, 3);
        ctx.restore();
      }

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isAlive ? mc.emoji : '💥', tw.x, tw.y);
    }

    // HP bar (if damaged)
    if (isAlive && tw.hp < tw.maxHp) {
      const pct = tw.hp / tw.maxHp;
      ctx.fillStyle = '#0008';
      ctx.fillRect(tw.x - 10, tw.y - 16, 20, 3);
      ctx.fillStyle = pct > 0.5 ? mc.color : '#ef4444';
      ctx.fillRect(tw.x - 10, tw.y - 16, 20 * pct, 3);
    }

    // Upgrade level rings
    const level = tw.level || 0;
    if (isAlive && level > 0) {
      ctx.strokeStyle = mc.color + '55';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(tw.x, tw.y, 14, 0, Math.PI * 2); ctx.stroke();
      if (level >= 2) {
        ctx.beginPath(); ctx.arc(tw.x, tw.y, 17, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
}

export function drawKukurzniki(ctx, g) {
  for (const k of g.kukurzniki) {
    const pt = g.towers.find(tw => tw.id === k.towerId);
    if (!pt || pt.hp <= 0) continue;

    // Orbit circle
    ctx.beginPath();
    ctx.arc(k.px, k.py, k.or, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b10';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Plane body
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.angle);
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(-5, -14, 18, 4);
    ctx.fillRect(-5, 10, 18, 4);
    ctx.strokeStyle = '#8B691488';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(1, -10); ctx.lineTo(1, 10);
    ctx.moveTo(9, -10); ctx.lineTo(9, 10);
    ctx.stroke();
    if (g.tick % 3 < 2) {
      ctx.strokeStyle = '#fff6';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, -5);
      ctx.lineTo(18, 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawFriendlyDrones(ctx, g) {
  for (const fd of g.friendlyDrones) {
    // Trail
    for (let i = 0; i < fd.trail.length; i++) {
      ctx.fillStyle = fd.lost
        ? `rgba(248,113,113,${(i / fd.trail.length) * 0.2})`
        : `rgba(56,189,248,${(i / fd.trail.length) * 0.25})`;
      ctx.beginPath();
      ctx.arc(fd.trail[i].x, fd.trail[i].y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drone body
    ctx.save();
    ctx.translate(fd.x, fd.y);
    ctx.rotate(fd.angle);
    ctx.fillStyle = fd.lost ? '#f8717155' : fd.color;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.strokeStyle = fd.lost ? '#f8717155' : fd.color;
    ctx.lineWidth = 1.2;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(dx * 5, dy * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(dx * 5, dy * 5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

export function drawProjectiles(ctx, g) {
  for (const p of g.projectiles) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
