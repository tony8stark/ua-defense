// Combat system: towers firing, projectiles, FPV drones
import { TICK, dist, ang, rnd, chance, uid } from './physics.js';
import { DEF_META } from '../data/units.js';
import { addLog } from './state.js';

export function updateCombat(g) {
  const m = g.mode;

  // TURRETS & CREWS
  for (const tw of g.towers) {
    if (tw.hp <= 0) {
      tw.deathTimer = (tw.deathTimer || 30) - 1;
      continue;
    }
    if (tw.type === 'airfield') continue;

    tw.cooldown = Math.max(0, tw.cooldown - TICK);
    if (tw.cooldown > 0) continue;

    let closest = null, closestDist = Infinity;
    const skipJet = tw.type === 'crew'; // FPV can't catch jet drones
    for (const en of g.enemies) {
      if (skipJet && en.type === 'shahed238') continue;
      const d = dist(tw, en);
      if (d < tw.range && d < closestDist) { closest = en; closestDist = d; }
    }
    if (!closest) continue;

    tw.angle = ang(tw, closest);
    tw.cooldown = tw.fireRate;

    if (tw.type === 'turret') {
      g.projectiles.push({
        x: tw.x, y: tw.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: tw.damage, speed: 7, color: DEF_META.turret.color,
        id: uid(), hitChance: tw.hitChance,
      });
    } else if (tw.type === 'crew') {
      if (chance(tw.lossChanceOverride ?? m.crew.lossChance)) {
        addFloat(g, tw.x, tw.y - 20, '📡 ВТРАТА ЗВ\'ЯЗКУ', '#f87171');
        addLog(g, '📡 FPV втратив зв\'язок');
        g.friendlyDrones.push({
          x: tw.x, y: tw.y, tid: -1, damage: 0, speed: 2.5, id: uid(),
          color: '#f8717166', trail: [], angle: rnd(0, Math.PI * 2), lost: true, lostTimer: 60,
        });
      } else {
        g.friendlyDrones.push({
          x: tw.x, y: tw.y, tid: closest.id, damage: tw.damage, speed: 3.2, id: uid(),
          color: DEF_META.crew.color, trail: [], angle: 0, hitChance: tw.hitChance, lost: false,
        });
      }
    }
  }

  // KUKURZNIKI (airfield drones)
  for (const k of g.kukurzniki) {
    const parent = g.towers.find(t => t.id === k.towerId);
    if (!parent || parent.hp <= 0) continue;

    k.oa += 0.013 * TICK;
    k.x = k.px + Math.cos(k.oa) * k.or;
    k.y = k.py + Math.sin(k.oa) * k.or;
    k.angle = k.oa + Math.PI / 2;

    k.cooldown = Math.max(0, k.cooldown - TICK);
    if (k.cooldown > 0) continue;

    let closest = null, closestDist = Infinity;
    for (const en of g.enemies) {
      if (en.type === 'shahed238') continue;
      const d = dist(k, en);
      if (d < k.range && d < closestDist) { closest = en; closestDist = d; }
    }
    if (closest) {
      k.cooldown = k.fireRate;
      g.projectiles.push({
        x: k.x, y: k.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: k.damage, speed: 5, color: DEF_META.airfield.color,
        id: uid(), hitChance: k.hitChance,
      });
    }
  }

  // PROJECTILES
  for (const p of g.projectiles) {
    const tgt = g.enemies.find(e => e.id === p.tid);
    if (tgt) { p.tx = tgt.x; p.ty = tgt.y; }
    const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.sqrt(dx * dx + dy * dy);

    if (d < p.speed * TICK * 2) {
      p.hit = true;
      if (tgt) {
        if (chance(p.hitChance || 0.5)) {
          tgt.hp -= p.damage;
          g.explosions.push({ x: p.tx, y: p.ty, r: 10, life: 12, ml: 12 });
          if (tgt.hp <= 0) {
            g.money += tgt.reward;
            g.score += tgt.reward;
            g.killed++;
            g.explosions.push({ x: tgt.x, y: tgt.y, r: 22, life: 24, ml: 24 });
            for (let i = 0; i < 6; i++) {
              g.particles.push({ x: tgt.x, y: tgt.y, vx: rnd(-3, 3), vy: rnd(-3, 3), life: rnd(15, 30), color: tgt.color });
            }
          }
        } else {
          addFloat(g, p.tx + rnd(-8, 8), p.ty - 8, '•', '#475569');
          g.particles.push({ x: p.tx + rnd(-15, 15), y: p.ty + rnd(-15, 15), vx: rnd(-0.5, 0.5), vy: rnd(-1, 0), life: 10, color: '#475569' });
        }
      }
    } else {
      p.x += (dx / d) * p.speed * TICK;
      p.y += (dy / d) * p.speed * TICK;
    }
  }
  g.projectiles = g.projectiles.filter(p => !p.hit);

  // FPV DRONES
  for (const fd of g.friendlyDrones) {
    if (fd.lost) {
      fd.x += Math.cos(fd.angle) * fd.speed * TICK;
      fd.y += Math.sin(fd.angle) * fd.speed * TICK;
      fd.angle += rnd(-0.1, 0.1);
      fd.trail.push({ x: fd.x, y: fd.y });
      if (fd.trail.length > 14) fd.trail.shift();
      fd.lostTimer -= TICK;
      const W = g.city.width, H = g.city.height;
      if (fd.lostTimer <= 0 || fd.x < -20 || fd.x > W + 20 || fd.y < -20 || fd.y > H + 20) fd.dead = true;
      continue;
    }

    let tgt = g.enemies.find(e => e.id === fd.tid);
    if (!tgt) {
      let cl = null, cd = Infinity;
      for (const en of g.enemies) {
        if (en.type === 'shahed238') continue;
        const d = dist(fd, en);
        if (d < cd) { cl = en; cd = d; }
      }
      if (cl) { fd.tid = cl.id; tgt = cl; } else { fd.dead = true; continue; }
    }

    const a = ang(fd, tgt);
    fd.x += Math.cos(a) * fd.speed * TICK;
    fd.y += Math.sin(a) * fd.speed * TICK;
    fd.angle = a;
    fd.trail.push({ x: fd.x, y: fd.y });
    if (fd.trail.length > 14) fd.trail.shift();

    if (dist(fd, tgt) < 14) {
      fd.dead = true;
      if (chance(fd.hitChance || 0.5)) {
        tgt.hp -= fd.damage;
        g.explosions.push({ x: fd.x, y: fd.y, r: 16, life: 18, ml: 18 });
        if (tgt.hp <= 0) {
          g.money += tgt.reward;
          g.score += tgt.reward;
          g.killed++;
          g.explosions.push({ x: tgt.x, y: tgt.y, r: 22, life: 24, ml: 24 });
        }
      } else {
        addFloat(g, fd.x, fd.y - 10, 'ПРОМАХ', '#64748b');
      }
    }
  }
  g.friendlyDrones = g.friendlyDrones.filter(d => !d.dead);
}

function addFloat(g, x, y, text, color) {
  g.floats.push({ x, y, text, color, life: 45, ml: 45 });
}
