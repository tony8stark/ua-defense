import { GRID, getSpawnPos } from '../data/cities.js';
import { clamp, dist } from './physics.js';

const FULL_SPECTRUM_INGRESS_EDGES = ['top', 'right', 'bottom', 'left'];

const DEEP_INGRESS_BASE = {
  shahed: 0.18,
  geran: 0.14,
  kh101: 1,
  kalibr: 1,
};

export const ENEMY_RETALIATION_CHANCE = {
  shahed: 0.72,
  geran: 0.78,
  shahed238: 0.62,
  lancet: 0.66,
  guided: 0.85,
  kh101: 0.58,
  kalibr: 0.6,
};

function uniqueSpawnEdges(city) {
  return [...new Set((city.spawnEdges || []).map(edge => edge.side))];
}

function isCruiseMissile(type) {
  return type === 'kh101' || type === 'kalibr';
}

export function getIngressEdges(city, type) {
  return isCruiseMissile(type)
    ? FULL_SPECTRUM_INGRESS_EDGES
    : uniqueSpawnEdges(city);
}

export function getDeepIngressChance(type, waveIndex, mode = {}) {
  let chance = DEEP_INGRESS_BASE[type] || 0;
  if (!chance) return 0;

  if (!isCruiseMissile(type)) {
    chance += Math.min(0.2, Math.max(0, waveIndex - 2) * 0.02);
    if (mode.endless) chance += 0.08;
    if (mode.iskander?.interval?.[0] < 800) chance += 0.04;
  }

  return Math.min(isCruiseMissile(type) ? 1 : 0.65, chance);
}

export function shouldUseDeepIngress(type, waveIndex, mode, roll = Math.random()) {
  return roll < getDeepIngressChance(type, waveIndex, mode);
}

export function createDeepIngressPlan(city, type, targetPoint, roll = Math.random) {
  const edges = getIngressEdges(city, type);
  const edge = edges[Math.min(edges.length - 1, Math.floor(roll() * edges.length))];
  const spawn = getSpawnPos(city, edge);

  const dx = targetPoint.x - spawn.x;
  const dy = targetPoint.y - spawn.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ratio = (isCruiseMissile(type) ? 0.72 : 0.66) + roll() * (isCruiseMissile(type) ? 0.16 : 0.12);
  const lateral = (roll() * 2 - 1) * GRID * (isCruiseMissile(type) ? 3.4 : 2.6);

  return {
    edge,
    spawn,
    pivot: {
      x: clamp(spawn.x + dx * ratio + nx * lateral, GRID, city.width - GRID),
      y: clamp(spawn.y + dy * ratio + ny * lateral, GRID, city.height - GRID),
    },
    phase: 'cruise',
    revealRadius: isCruiseMissile(type) ? GRID * 2.2 : GRID * 3.2,
  };
}

export function createGuidedWaypoints(city, spawn, targetPoint, roll = Math.random) {
  const dx = targetPoint.x - spawn.x;
  const dy = targetPoint.y - spawn.y;
  const len = Math.hypot(dx, dy) || 1;
  if (len < GRID * 5) return [];

  const nx = -dy / len;
  const ny = dx / len;
  const bend = (roll() * 2 - 1) * GRID * 2.4;

  return [
    {
      x: clamp(spawn.x + dx * (0.38 + roll() * 0.08) + nx * bend, GRID, city.width - GRID),
      y: clamp(spawn.y + dy * (0.38 + roll() * 0.08) + ny * bend, GRID, city.height - GRID),
    },
    {
      x: clamp(spawn.x + dx * (0.72 + roll() * 0.08) - nx * bend * 0.4, GRID, city.width - GRID),
      y: clamp(spawn.y + dy * (0.72 + roll() * 0.08) - ny * bend * 0.4, GRID, city.height - GRID),
    },
  ];
}

export function applyRetaliationTarget(enemy, towerId, roll = Math.random()) {
  const chance = ENEMY_RETALIATION_CHANCE[enemy.type] || 0;
  if (!towerId || !chance || roll >= chance) return false;

  const target = { mode: 'tower', id: towerId };
  if (enemy.deepIngress?.phase === 'cruise') {
    enemy.pendingTarget = target;
  } else {
    enemy.target = target;
  }
  enemy.retaliationTargetId = towerId;
  return true;
}

export function advanceEnemyNavigation(enemy) {
  let promotedTarget = null;

  if (enemy.deepIngress?.phase === 'cruise' && dist(enemy, enemy.deepIngress.pivot) < enemy.deepIngress.revealRadius) {
    enemy.deepIngress.phase = 'terminal';
    if (enemy.pendingTarget) {
      enemy.target = enemy.pendingTarget;
      promotedTarget = enemy.pendingTarget;
      enemy.pendingTarget = null;
    }
  }

  if (enemy.guidedPath?.length && dist(enemy, enemy.guidedPath[0]) < GRID * 0.75) {
    enemy.guidedPath.shift();
  }

  return promotedTarget;
}

export function getEnemyNavPoint(enemy, targetPoint) {
  if (enemy.deepIngress?.phase === 'cruise') return enemy.deepIngress.pivot;
  if (enemy.guidedPath?.length) return enemy.guidedPath[0];
  return targetPoint;
}

export function isEnemyInCruiseIngress(enemy) {
  return enemy.deepIngress?.phase === 'cruise';
}
