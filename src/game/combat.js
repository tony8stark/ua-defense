// Combat system: towers firing, projectiles, FPV drones
import { TICK, dist, ang, rnd, chance, uid } from './physics.js';
import { DEF_META } from '../data/units.js';
import { addLog, registerKill, recordUnitKill, getTrivogaFireRateMul, getBuildingBonuses } from './state.js';
import { applyRetaliationTarget, isEnemyInCruiseIngress } from './enemy-ai.js';
import { getEWMultipliers, getWeatherAccuracyMultiplier, getWeatherRangeMultiplier } from './events.js';
import { coolTurretOverheat, recordTurretShot } from './overheat.js';
import { playShoot, playFPVLaunch, playExplosion } from '../audio/SoundManager.js';
import { getKillQuip } from '../data/battleQuips.js';

export function updateCombat(g) {
  const m = g.mode;
  const ew = getEWMultipliers(g);
  const weather = g.weather;

  // TURRETS, CREWS, HAWK, GEPARD, IRIS-T
  const SLOW_SPEED_THRESHOLD = 1.5;
  const trivogaMul = getTrivogaFireRateMul(g);
  const trivogaOn = g.trivogaActive > 0;
  const TERRAIN_SNAP = 22; // tower must be within 22px of terrain tile center
  const bb = getBuildingBonuses(g); // building bonuses (range, damage, accuracy)

  for (const tw of g.towers) {
    if (tw.hp <= 0) {
      tw.deathTimer = (tw.deathTimer || 30) - 1;
      continue;
    }
    if (tw.type === 'airfield' || tw.type === 'decoy') continue;

    coolTurretOverheat(tw, TICK);
    tw.cooldown = Math.max(0, tw.cooldown - TICK / trivogaMul);
    if ((tw.overheatLock || 0) > 0) continue;
    if (tw.cooldown > 0) continue;

    // Find target based on tower type
    let closest = null, closestDist = Infinity;
    // Terrain bonus: elevation gives +15% range
    const onElevation = g.city.terrainTiles?.some(t => t.type === 'elevation' && dist(tw, t) < TERRAIN_SNAP);
    const effectiveRange = tw.range * getWeatherRangeMultiplier(weather, tw.type) * (1 + bb.range) * (onElevation ? 1.15 : 1);
    for (const en of g.enemies) {
      // Stealth enemies can't be targeted
      if (en.stealth) continue;
      // Deep-ingress targets are only reachable by dedicated systems before terminal dive
      if (isEnemyInCruiseIngress(en) && tw.type !== 'hawk' && tw.type !== 'irist') continue;
      // High-altitude Shaheds: crew (FPV) and kukurzniki can't reach them
      if (en.altitude === 'high' && (tw.type === 'crew')) continue;
      // Crew skips Shahed-238
      if (tw.type === 'crew' && en.type === 'shahed238') continue;
      // HAWK only targets slow enemies (Shahed, Geran, Kalibr, Orlan, Kh-101)
      if (tw.type === 'hawk' && en.speed > SLOW_SPEED_THRESHOLD && en.type !== 'kalibr' && en.type !== 'kh101') continue;
      // IRIS-T targets highest HP enemy in range (not nearest)
      const d = dist(tw, en);
      if (d < effectiveRange) {
        if (tw.type === 'irist') {
          if (!closest || en.hp > closest.hp) { closest = en; closestDist = d; }
        } else {
          if (d < closestDist) { closest = en; closestDist = d; }
        }
      }
    }
    if (!closest) continue;

    tw.angle = ang(tw, closest);
    tw.cooldown = tw.fireRate;

    const dmgMul = 1 + bb.damage;
    const accBonus = bb.accuracy;

    if (tw.type === 'turret' || tw.type === 'mvg' || tw.type === 'hawk') {
      if (g.tick % 3 === 0) playShoot();
      // MVG gets +15% accuracy vs fast targets (Lancet, Shahed-238) — its niche
      const mvgFastBonus = (tw.type === 'mvg' && closest.speed > SLOW_SPEED_THRESHOLD) ? 0.15 : 0;
      // Тривога bonuses: MVG +20% acc, HAWK 100% hit
      const trivogaAcc = trivogaOn ? (tw.type === 'mvg' ? 0.20 : tw.type === 'hawk' ? 1.0 : 0) : 0;
      const weatherAccMul = getWeatherAccuracyMultiplier(weather, tw.type);
      const baseHit = tw.type === 'hawk' && trivogaOn ? 1.0
        : (tw.hitChance + accBonus + mvgFastBonus + trivogaAcc) * weatherAccMul;
      // Тривога: turret fires at up to 3 targets simultaneously
      const targets = (tw.type === 'turret' && trivogaOn) ? findMultiTargets(g, tw, effectiveRange, 3) : [closest];
      for (const tgt of targets) {
        markEnemyUnderFire(g, tgt.id, tw.id);
        g.projectiles.push({
          x: tw.x, y: tw.y, tid: tgt.id, tx: tgt.x, ty: tgt.y,
          damage: Math.round(tw.damage * dmgMul), speed: tw.type === 'hawk' ? 8 : 7, color: DEF_META[tw.type].color,
          id: uid(), hitChance: baseHit,
          sourceTowerId: tw.id, isHawkMissile: tw.type === 'hawk',
        });
      }
      if (tw.type === 'turret') {
        const heat = recordTurretShot(tw, m);
        if (heat.overheated) {
          tw.cooldown = Math.max(tw.cooldown, heat.overheatLock);
          addFloat(g, tw.x, tw.y - 18, 'ПЕРЕГРІВ', '#f97316');
        }
      }
    } else if (tw.type === 'gepard') {
      playShoot();
      // Тривога: Gepard fires 3 projectiles instead of 2
      const burstCount = trivogaOn ? 3 : 2;
      markEnemyUnderFire(g, closest.id, tw.id);
      for (let i = 0; i < burstCount; i++) {
        g.projectiles.push({
          x: tw.x + rnd(-3, 3), y: tw.y + rnd(-3, 3),
          tid: closest.id, tx: closest.x + rnd(-5, 5), ty: closest.y + rnd(-5, 5),
          damage: Math.round(tw.damage * dmgMul), speed: 9, color: DEF_META.gepard.color,
          id: uid(), hitChance: (tw.hitChance + accBonus) * getWeatherAccuracyMultiplier(weather, tw.type),
          sourceTowerId: tw.id,
        });
      }
    } else if (tw.type === 'irist') {
      playFPVLaunch();
      // Тривога: IRIS-T gets 100% hit chance
      const iristHit = trivogaOn ? 1.0
        : Math.min(0.98, (tw.hitChance + accBonus) * getWeatherAccuracyMultiplier(weather, tw.type));
      markEnemyUnderFire(g, closest.id, tw.id);
      g.projectiles.push({
        x: tw.x, y: tw.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: tw.damage, speed: 10, color: DEF_META.irist.color,
        id: uid(), hitChance: iristHit,
        sourceTowerId: tw.id, isIRIST: true,
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
        // Тривога: Crew launches 2 FPV drones per shot
        const fpvCount = trivogaOn ? 2 : 1;
        markEnemyUnderFire(g, closest.id, tw.id);
        for (let f = 0; f < fpvCount; f++) {
          g.friendlyDrones.push({
            x: tw.x + (f > 0 ? rnd(-5, 5) : 0), y: tw.y + (f > 0 ? rnd(-5, 5) : 0),
            tid: closest.id, damage: tw.damage, speed: 3.2, id: uid(),
            color: DEF_META.crew.color, trail: [], angle: 0, hitChance: tw.hitChance, lost: false,
            sourceTowerId: tw.id,
          });
        }
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

    k.cooldown = Math.max(0, k.cooldown - TICK / trivogaMul);
    if (k.cooldown > 0) continue;

    let closest = null, closestDist = Infinity;
    const kRange = k.range * getWeatherRangeMultiplier(weather, 'airfield');
    for (const en of g.enemies) {
      if (en.stealth) continue;
      if (en.type === 'shahed238') continue;
      if (en.altitude === 'high' || isEnemyInCruiseIngress(en)) continue; // Can't reach high-altitude targets
      const d = dist(k, en);
      if (d < kRange && d < closestDist) { closest = en; closestDist = d; }
    }
    if (closest) {
      k.cooldown = k.fireRate;
      markEnemyUnderFire(g, closest.id, k.towerId);
      g.projectiles.push({
        x: k.x, y: k.y, tid: closest.id, tx: closest.x, ty: closest.y,
        damage: k.damage, speed: 5, color: DEF_META.airfield.color,
        id: uid(), hitChance: k.hitChance * ew.kukurznikAccMul * getWeatherAccuracyMultiplier(weather, 'airfield') * (trivogaOn ? 2.0 : 1.0),
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
        // Guided drones can dodge (IRIS-T and F-16 missiles bypass)
        const dodged = tgt.dodgeChance && chance(tgt.dodgeChance) && !p.isF16Missile && !p.isIRIST;
        // High-altitude targets: -40% accuracy for projectiles (IRIS-T unaffected)
        const altPenalty = (tgt.altitude === 'high' && !p.isIRIST && !p.isHawkMissile) ? 0.60 : 1.0;
        // Weather accuracy already applied at projectile creation — no second multiplier
        if (!dodged && chance((p.hitChance || 0.5) * altPenalty)) {
          tgt.hp -= p.damage;
          g.explosions.push({ x: p.tx, y: p.ty, r: 10, life: 12, ml: 12 });
          // Track kill on source tower
          if (tgt.hp <= 0) {
            g.money += tgt.reward;
            g.score += tgt.reward;
            g.killed++;
            if (g.killedByType[tgt.type] !== undefined) g.killedByType[tgt.type]++;
            registerKill(g, tgt.reward, tgt.x, tgt.y);
            playExplosion(false);
            // Credit kill to tower
            if (p.sourceTowerId) recordUnitKill(g, p.sourceTowerId);
            // Random kill quip
            const quip = getKillQuip(tgt.type);
            if (quip) addLog(g, quip);
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
        if (en.stealth) continue;
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
          if (g.killedByType[tgt.type] !== undefined) g.killedByType[tgt.type]++;
          registerKill(g, tgt.reward, tgt.x, tgt.y);
          // Credit kill to crew tower
          if (fd.sourceTowerId) recordUnitKill(g, fd.sourceTowerId);
          const quip = getKillQuip(tgt.type);
          if (quip) addLog(g, quip);
          g.explosions.push({ x: tgt.x, y: tgt.y, r: 22, life: 24, ml: 24 });
        }
      } else {
        addFloat(g, fd.x, fd.y - 10, dodged ? 'УХИЛЕННЯ' : 'ПРОМАХ', dodged ? '#ff6b6b' : '#64748b');
      }
    }
  }
  g.friendlyDrones = g.friendlyDrones.filter(d => !d.dead);
}

// Helper: find up to N enemies in range (for Тривога turret multi-target)
function findMultiTargets(g, tw, range, max) {
  const targets = [];
  for (const en of g.enemies) {
    if (en.stealth) continue;
    if (dist(tw, en) < range) {
      targets.push({ en, d: dist(tw, en) });
    }
  }
  targets.sort((a, b) => a.d - b.d);
  return targets.slice(0, max).map(t => t.en);
}

function addFloat(g, x, y, text, color) {
  g.floats.push({ x, y, text, color, life: 45, ml: 45 });
}

function markEnemyUnderFire(g, enemyId, towerId) {
  const enemy = g.enemies.find(candidate => candidate.id === enemyId && candidate.hp > 0);
  const tower = g.towers.find(candidate => candidate.id === towerId && candidate.hp > 0);
  if (!enemy || !tower) return;
  applyRetaliationTarget(enemy, towerId, Math.random(), g.mode, g.wave);
}
