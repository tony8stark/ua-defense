// Core math/physics utilities

export const TICK = 0.55; // global speed multiplier

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
