function getTurretHeatProfile(mode) {
  const turret = mode?.turret || {};
  return {
    overheatShots: turret.overheatShots ?? 4,
    overheatCooldown: turret.overheatCooldown ?? Math.max(48, (turret.fireRate || 12) * 4),
  };
}

export function coolTurretOverheat(tower, tick) {
  if (tower.type !== 'turret') return;
  tower.overheatLock = Math.max(0, (tower.overheatLock || 0) - tick);
}

export function recordTurretShot(tower, mode) {
  if (tower.type !== 'turret') return { overheated: false, overheatLock: 0 };

  const profile = getTurretHeatProfile(mode);
  tower.burstShots = (tower.burstShots || 0) + 1;
  if (tower.burstShots < profile.overheatShots) {
    return { overheated: false, overheatLock: tower.overheatLock || 0 };
  }

  tower.burstShots = 0;
  tower.overheatLock = profile.overheatCooldown;
  return { overheated: true, overheatLock: tower.overheatLock };
}
