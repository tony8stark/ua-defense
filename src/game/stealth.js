import { GRID } from '../data/cities.js';
import { dist } from './physics.js';
import { getWeatherStealthRevealMultiplier } from './events.js';
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

  const weatherMul = getWeatherStealthRevealMultiplier(g.weather);
  const { pointDefenseRadius, targetApproachRadius } = getStealthRevealConfig(enemy.type);
  const effectivePointDefenseRadius = pointDefenseRadius * weatherMul;
  const effectiveTargetApproachRadius = targetApproachRadius * weatherMul;

  const nearPointDefense = g.towers.some(tower => tower.hp > 0 && dist(enemy, tower) < effectivePointDefenseRadius);
  if (nearPointDefense) return true;

  const target = getTargetPoint(g, enemy.target);
  if (!target) return false;

  return dist(enemy, target) < effectiveTargetApproachRadius;
}
