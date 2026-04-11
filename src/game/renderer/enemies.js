// Enemy drone rendering with SVG sprites
import { ENEMY_SPRITES, drawSprite } from '../../data/sprites.js';
import { getEnemyRenderAngle } from '../../data/enemies.js';

export function drawEnemies(ctx, g) {
  for (const en of g.enemies) {
    // Stealth enemies: almost invisible (faint shimmer only)
    if (en.stealth) {
      const shimmer = Math.sin(g.tick * 0.2 + en.id * 5) * 0.5 + 0.5;
      ctx.globalAlpha = shimmer * 0.08;
      ctx.fillStyle = en.color;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.sz * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }

    // Target line for tower-hunting enemies
    if (en.target?.mode === 'tower') {
      const tw = g.towers.find(t => t.id === en.target.id && t.hp > 0);
      if (tw) {
        ctx.strokeStyle = '#ef444425';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(en.x, en.y);
        ctx.lineTo(tw.x, tw.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw sprite
    const sprite = ENEMY_SPRITES[en.type];
    const scale = en.sz / 14; // normalize to base size
    const renderAngle = getEnemyRenderAngle(en.type, en.angle);
    if (sprite && sprite.complete) {
      drawSprite(ctx, sprite, en.x, en.y, renderAngle, scale);
    } else {
      // Fallback: original procedural rendering
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.rotate(renderAngle);
      const sz = en.sz;
      ctx.fillStyle = en.color;
      ctx.beginPath();
      ctx.moveTo(sz, 0);
      ctx.lineTo(-sz * 0.6, -sz * 0.7);
      ctx.lineTo(-sz * 0.3, 0);
      ctx.lineTo(-sz * 0.6, sz * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Altitude indicator for high-flying Shaheds
    if (en.altCycle && (en.altitude === 'high' || en.altitude === 'climbing')) {
      const isHigh = en.altitude === 'high';
      ctx.globalAlpha = isHigh ? 0.55 : 0.75; // high = more translucent
      // Altitude label
      ctx.font = "bold 6px 'Courier New'";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      const altM = isHigh ? '4500м' : '▲';
      ctx.fillText(altM, en.x, en.y - en.sz - 12);
      // Dotted circle showing altitude zone
      if (isHigh) {
        ctx.strokeStyle = 'rgba(148,163,184,0.25)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.sz + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    }

    // Special effects per type (glow, labels)
    if (en.type === 'lancet') {
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(en.x, en.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (en.type === 'shahed238') {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(
        en.x - Math.cos(en.angle) * en.sz * 0.6,
        en.y - Math.sin(en.angle) * en.sz * 0.6,
        3, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (en.type === 'guided') {
      const pulse = Math.sin(g.tick * 0.2) * 0.4 + 0.6;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10 * pulse;
      ctx.fillStyle = `rgba(255,0,0,${pulse})`;
      ctx.beginPath();
      ctx.arc(en.x, en.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (g.tick % 60 < 40) {
        ctx.font = "bold 7px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff6b6b88';
        ctx.fillText('ОПЕРАТОР', en.x, en.y - en.sz - 12);
      }
    }
    if (en.type === 'kalibr') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(
        en.x - Math.cos(en.angle) * en.sz * 0.7,
        en.y - Math.sin(en.angle) * en.sz * 0.7,
        3 + Math.random() * 2, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    if (en.type === 'kh101') {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(
        en.x - Math.cos(en.angle) * en.sz * 0.6,
        en.y - Math.sin(en.angle) * en.sz * 0.6,
        2.5 + Math.random() * 1.5, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      if (g.tick % 70 < 50) {
        ctx.font = "bold 7px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c084fc88';
        ctx.fillText('Кх-101', en.x, en.y - en.sz - 12);
      }
    }
    if (en.type === 'orlan') {
      const pulse = Math.sin(g.tick * 0.15) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(110,231,183,${pulse * 0.5})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(en.x, en.y, 18 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (g.tick % 80 < 55) {
        ctx.font = "bold 7px 'Courier New'";
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6ee7b788';
        ctx.fillText('РОЗВІДКА', en.x, en.y - en.sz - 12);
      }
    }

    // Safety reset: ensure no shadow state leaks into HP bar or next enemy
    ctx.shadowBlur = 0;

    // HP bar
    const pct = en.hp / en.maxHp;
    ctx.fillStyle = '#000a';
    ctx.fillRect(en.x - 11, en.y - en.sz - 7, 22, 3);
    ctx.fillStyle = pct > 0.5 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(en.x - 11, en.y - en.sz - 7, 22 * pct, 3);
  }
}
