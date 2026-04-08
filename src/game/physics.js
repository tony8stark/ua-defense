// Core math/physics utilities

export const BASE_TICK = 0.55;
export let TICK = BASE_TICK;

// Slow down on late waves when lots of enemies on screen
export function updateTick(g) {
  const totalWaves = g.mode.waves.length;
  const progress = g.wave / totalWaves; // 0..1
  const enemyCount = g.enemies.length;

  // Late waves (past 60%) with many enemies: slow down
  if (progress > 0.6 && enemyCount > 8) {
    const intensity = Math.min(1, (enemyCount - 8) / 15); // 0..1 based on enemy count
    const slowFactor = 1 - intensity * 0.35; // down to 0.65x speed
    TICK = BASE_TICK * slowFactor;
  } else {
    TICK = BASE_TICK;
  }
}

let _id = 0;
export function resetIds() { _id = 0; }
export function uid() { return ++_id; }

export function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function ang(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function rnd(a, b) {
  return Math.random() * (b - a) + a;
}

export function chance(p) {
  return Math.random() < p;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
