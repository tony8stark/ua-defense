// Combat system: towers firing, projectiles, FPV drones
import { TICK, dist, ang, rnd, chance, uid } from './physics.js';
import { DEF_META } from '../data/units.js';
import { addLog } from './state.js';
import { getEWMultipliers } from './events.js';
import { playShoot, playFPVLaunch, playExplosion } from '../audio/SoundManager.js';

export function updateCombat(g) {
  const m = g.mode;
  const ew = getEWMultipliers(g);
  const weather = g.weather?.effects || {};

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
    const skipJet = tw.type === 'crew';
    const effectiveRange = tw.range * (weather.rangeMul || 1);
    for (const en of g.enemies) {
      if (skipJet && en.type === 'shahed238') continue;
      const d = dist(tw, en);
      if (d < effectiveRange && d < closestDist) { closest = en; closestDist = d; }
    }
    if (!closest) continue;

    tw.angle = ang(tw, closest);
    tw.cooldown = tw.fireRate;

    if (tw.type === 'turret') {
      if (g.tick % 3 === 0) playShoot(); // throttle sound
      g.projectiles.push({
        x: tw.x, y: tw.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: tw.damage, speed: 7, color: DEF_META.turret.color,
        id: uid(), hitChance: tw.hitChance * (weather.turretAccMul || 1) * (weather.accuracyMul || 1),
        sourceTowerId: tw.id,
      });
    } else if (tw.type === 'crew') {
      if (chance((tw.lossChanceOverride ?? m.crew.lossChance) * ew.fpvLossMul)) {
        addFloat(g, tw.x, tw.y - 20, '📡 ВТРАТА ЗВ\'ЯЗКУ', '#f87171');
        addLog(g, '📡 FPV втратив зв\'язок');
        g.friendlyDrones.push({
          x: tw.x, y: tw.y, tid: -1, damage: 0, speed: 2.5, id: uid(),
          color: '#f8717166', trail: [], angle: rnd(0, Math.PI * 2), lost: true, lostTimer: 60,
        });
      } else {
        playFPVLaunch();
        g.friendlyDrones.push({
          x: tw.x, y: tw.y, tid: closest.id, damage: tw.damage, speed: 3.2, id: uid(),
          color: DEF_META.crew.color, trail: [], angle: 0, hitChance: tw.hitChance, lost: false,
          sourceTowerId: tw.id,
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
    const kRange = k.range * (weather.rangeMul || 1);
    for (const en of g.enemies) {
      if (en.type === 'shahed238') continue;
      const d = dist(k, en);
      if (d < kRange && d < closestDist) { closest = en; closestDist = d; }
    }
    if (closest) {
      k.cooldown = k.fireRate;
      g.projectiles.push({
        x: k.x, y: k.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: k.damage, speed: 5, color: DEF_META.airfield.color,
        id: uid(), hitChance: k.hitChance * ew.kukurznikAccMul * (weather.accuracyMul || 1),
        sourceTowerId: k.towerId,
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
        // Guided drones can dodge
        const dodged = tgt.dodgeChance && chance(tgt.dodgeChance) && !p.isF16Missile;
        const accMul = weather.turretAccMul || weather.accuracyMul || 1;
        if (!dodged && chance((p.hitChance || 0.5) * accMul)) {
          tgt.hp -= p.damage;
          g.explosions.push({ x: p.tx, y: p.ty, r: 10, life: 12, ml: 12 });
          // Track kill on source tower
          if (tgt.hp <= 0) {
            g.money += tgt.reward;
            g.score += tgt.reward;
            g.killed++;
            playExplosion(false);
            // Credit kill to tower
            const src = p.sourceTowerId ? g.towers.find(t => t.id === p.sourceTowerId) : null;
            if (src) src.kills = (src.kills || 0) + 1;
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
      const dodged = tgt.dodgeChance && chance(tgt.dodgeChance);
      if (!dodged && chance(fd.hitChance || 0.5)) {
        // 7% crit chance: direct hit to critical systems, instant kill
        const isCrit = chance(0.07);
        const dmg = isCrit ? tgt.hp + 1 : fd.damage;
        tgt.hp -= dmg;
        if (isCrit) addFloat(g, fd.x, fd.y - 14, 'КРИТ!', '#fbbf24');
        g.explosions.push({ x: fd.x, y: fd.y, r: isCrit ? 24 : 16, life: isCrit ? 24 : 18, ml: isCrit ? 24 : 18 });
        if (tgt.hp <= 0) {
          g.money += tgt.reward;
          g.score += tgt.reward;
          g.killed++;
          // Credit kill to crew tower
          if (fd.sourceTowerId) {
            const src = g.towers.find(t => t.id === fd.sourceTowerId);
            if (src) src.kills = (src.kills || 0) + 1;
          }
          g.explosions.push({ x: tgt.x, y: tgt.y, r: 22, life: 24, ml: 24 });
        }
      } else {
        addFloat(g, fd.x, fd.y - 10, dodged ? 'УХИЛЕННЯ' : 'ПРОМАХ', dodged ? '#ff6b6b' : '#64748b');
      }
    }
  }
  g.friendlyDrones = g.friendlyDrones.filter(d => !d.dead);
}

function addFloat(g, x, y, text, color) {
  g.floats.push({ x, y, text, color, life: 45, ml: 45 });
}
