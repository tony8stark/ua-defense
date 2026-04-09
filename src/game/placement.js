import { GRID } from '../data/cities.js';
import { dist } from './physics.js';

export const PLACEMENT_BUFFER_CELLS = 1;

export function snapPlacementToGrid(point) {
  return {
    x: Math.floor(point.x / GRID) * GRID + GRID / 2,
    y: Math.floor(point.y / GRID) * GRID + GRID / 2,
  };
}

export function getPlacementFootprintRect(x, y, bufferCells = PLACEMENT_BUFFER_CELLS) {
  const half = GRID / 2;
  return {
    left: x - half - bufferCells * GRID,
    right: x + half + bufferCells * GRID,
    top: y - half - bufferCells * GRID,
    bottom: y + half + bufferCells * GRID,
    width: GRID * (bufferCells * 2 + 1),
    height: GRID * (bufferCells * 2 + 1),
  };
}

export function getTowerPlacementFootprint(tower) {
  return {
    ...getPlacementFootprintRect(tower.x, tower.y),
    id: tower.id,
    type: tower.type,
  };
}

function isWithinPlacementZone(zone, point) {
  if (point.x < zone.left || point.x > zone.right) return false;
  if (typeof zone.top === 'number' && point.y < zone.top) return false;
  if (typeof zone.bottom === 'number' && point.y > zone.bottom) return false;
  return true;
}

function isInsideRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right
    && point.y >= rect.top && point.y <= rect.bottom;
}

export function canPlaceTowerAt(g, type, point) {
  const snapped = snapPlacementToGrid(point);
  const zone = g.city.placeZone;

  if (!isWithinPlacementZone(zone, snapped)) {
    return { ok: false, snapped, reason: 'zone' };
  }

  const blockingTower = g.towers.find(tower => (
    tower.hp > 0 && isInsideRect(snapped, getTowerPlacementFootprint(tower))
  ));
  if (blockingTower) {
    return {
      ok: false,
      snapped,
      reason: 'footprint',
      blockingTowerId: blockingTower.id,
      blockingType: blockingTower.type,
    };
  }

  const blockingBuilding = g.buildings.find(building => dist(snapped, building) < 35);
  if (blockingBuilding) {
    return {
      ok: false,
      snapped,
      reason: 'building',
      blockingBuildingKey: blockingBuilding.key,
    };
  }

  return { ok: true, snapped, reason: null, type };
}

export function getPlacementPreview(g, type, point) {
  const result = canPlaceTowerAt(g, type, point);
  return {
    x: result.snapped.x,
    y: result.snapped.y,
    valid: result.ok,
    reason: result.reason,
    type,
  };
}
