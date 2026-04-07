// City configurations
// Each city defines: layout dimensions, buildings, spawn edges, terrain style

export const GRID = 28;

export const CITIES = {
  odesa: {
    id: 'odesa',
    name: 'Одеса',
    emoji: '⚓',
    desc: 'Стратегічний порт на Чорному морі. Масовані атаки дронами з морського напрямку.',
    color: '#38bdf8',
    hints: ['🌊 Вороги тільки зі сходу', '🛢️ Захисти нафтобазу та порт', '🔫 Турелі найефективніші'],
    // Canvas logical size
    width: 900,
    height: 600,
    // Land boundary X (sea starts here)
    landX: 620,
    // Defense placement zone
    placeZone: { left: 80, right: 590 },
    // Buildings (left side, defended infrastructure)
    buildings: [
      { key: 'power', emoji: '⚡', name: 'Електростанція', x: 38, y: 80, maxHp: 200 },
      { key: 'oil', emoji: '🛢️', name: 'Нафтобаза', x: 38, y: 180, maxHp: 150 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 38, y: 280, maxHp: 120 },
      { key: 'comm', emoji: '📡', name: 'Вежа зв\'язку', x: 38, y: 380, maxHp: 100 },
      { key: 'factory', emoji: '🏭', name: 'Завод', x: 38, y: 480, maxHp: 180 },
    ],
    // Where enemies spawn from (edges)
    spawnEdges: [
      { side: 'right', weight: 1.0 }, // all from east (sea)
    ],
    // Terrain type for renderer
    terrain: 'coastal',
    // City-specific bonuses (none for Odesa base map)
    bonuses: {},
  },

  kyiv: {
    id: 'kyiv',
    name: 'Київ',
    emoji: '🏛️',
    desc: 'Столиця. Атаки з півночі та сходу. Системи Patriot на варті.',
    color: '#a78bfa',
    hints: ['📍 Атака з кількох напрямків', '🏛️ Захисти центр міста', '🎯 Patriot +15% точність турелей'],
    width: 900,
    height: 600,
    landX: 900, // no sea, all land
    placeZone: { left: 40, right: 860 },
    buildings: [
      { key: 'rada', emoji: '🏛️', name: 'Верховна Рада', x: 450, y: 280, maxHp: 250 },
      { key: 'energy', emoji: '⚡', name: 'Енергомережа', x: 350, y: 180, maxHp: 200 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 550, y: 180, maxHp: 120 },
      { key: 'telecom', emoji: '📡', name: 'Телеком-вузол', x: 350, y: 380, maxHp: 100 },
      { key: 'metro', emoji: '🚇', name: 'Метро', x: 550, y: 380, maxHp: 180 },
    ],
    spawnEdges: [
      { side: 'top', weight: 0.4 },    // from north (Belarus direction)
      { side: 'right', weight: 0.35 },  // from east
      { side: 'topright', weight: 0.25 }, // from NE
    ],
    terrain: 'urban',
    bonuses: {
      turretAccuracy: 0.15, // Patriot systems: +15% turret hit chance
    },
  },
};

// Get spawn position for a given edge
export function getSpawnPos(city, edge) {
  const W = city.width, H = city.height;
  const margin = 40;
  const rnd = (a, b) => Math.random() * (b - a) + a;

  switch (edge) {
    case 'right':
      return { x: W + rnd(10, 80), y: rnd(margin, H - margin) };
    case 'top':
      return { x: rnd(margin, W - margin), y: -rnd(10, 80) };
    case 'topright':
      // corner area: randomize between top-right quadrant
      return Math.random() < 0.5
        ? { x: W + rnd(10, 60), y: rnd(margin, H * 0.4) }
        : { x: rnd(W * 0.6, W - margin), y: -rnd(10, 60) };
    case 'left':
      return { x: -rnd(10, 80), y: rnd(margin, H - margin) };
    case 'bottom':
      return { x: rnd(margin, W - margin), y: H + rnd(10, 80) };
    default:
      return { x: W + rnd(10, 80), y: rnd(margin, H - margin) };
  }
}

// Pick a random spawn edge based on weights
export function pickSpawnEdge(city) {
  const edges = city.spawnEdges;
  const totalWeight = edges.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const e of edges) {
    r -= e.weight;
    if (r <= 0) return e.side;
  }
  return edges[edges.length - 1].side;
}
