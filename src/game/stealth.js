import { GRID } from '../data/cities.js';
import { dist } from './physics.js';
import { getTargetPoint } from './spawner.js';

const STEALTH_REVEAL_CONFIG = {
  shahed: {
    pointDefenseRadius: GRID * 1.5,
    targetApproachRadius: GRID * 5,
  },
  geran: {
    pointDefenseRadius: GRID * 2,
    targetApproachRadius: GRID * 5.5,
  },
};

const DEFAULT_STEALTH_REVEAL = {
  pointDefenseRadius: GRID * 2,
  targetApproachRadius: GRID * 5,
};

export function getStealthRevealConfig(type) {
  return STEALTH_REVEAL_CONFIG[type] || DEFAULT_STEALTH_REVEAL;
}

export function shouldRevealStealthEnemy(g, enemy) {
  if (!enemy?.stealth) return false;

  const { pointDefenseRadius, targetApproachRadius } = getStealthRevealConfig(enemy.type);

  const nearPointDefense = g.towers.some(tower => tower.hp > 0 && dist(enemy, tower) < pointDefenseRadius);
  if (nearPointDefense) return true;

  const target = getTargetPoint(g, enemy.target);
  if (!target) return false;

  return dist(enemy, target) < targetApproachRadius;
}
