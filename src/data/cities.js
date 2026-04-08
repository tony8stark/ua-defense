// City configurations
// Each city defines: layout dimensions, buildings, spawn edges, terrain style

export const GRID = 28;

const DESKTOP = {
  odesa: {
    id: 'odesa',
    name: 'Одеса',
    emoji: '⚓',
    desc: 'Стратегічний порт на Чорному морі. Масовані атаки дронами з морського напрямку.',
    color: '#38bdf8',
    hints: ['🌊 Вороги тільки зі сходу', '🛢️ Захисти нафтобазу та порт', '🔫 Турелі найефективніші'],
    width: 900,
    height: 600,
    landX: 620,
    placeZone: { left: 80, right: 590 },
    buildings: [
      { key: 'power', emoji: '⚡', name: 'Електростанція', x: 38, y: 80, maxHp: 200 },
      { key: 'oil', emoji: '🛢️', name: 'Нафтобаза', x: 38, y: 180, maxHp: 150 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 38, y: 280, maxHp: 120 },
      { key: 'comm', emoji: '📡', name: 'Вежа зв\'язку', x: 38, y: 380, maxHp: 100 },
      { key: 'factory', emoji: '🏭', name: 'Завод', x: 38, y: 480, maxHp: 180 },
    ],
    spawnEdges: [{ side: 'right', weight: 1.0 }],
    terrain: 'coastal',
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
    landX: 900,
    placeZone: { left: 40, right: 860 },
    buildings: [
      { key: 'rada', emoji: '🏛️', name: 'Верховна Рада', x: 450, y: 280, maxHp: 250 },
      { key: 'energy', emoji: '⚡', name: 'Енергомережа', x: 350, y: 180, maxHp: 200 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 550, y: 180, maxHp: 120 },
      { key: 'telecom', emoji: '📡', name: 'Телеком-вузол', x: 350, y: 380, maxHp: 100 },
      { key: 'metro', emoji: '🚇', name: 'Метро', x: 550, y: 380, maxHp: 180 },
    ],
    spawnEdges: [
      { side: 'top', weight: 0.4 },
      { side: 'right', weight: 0.35 },
      { side: 'topright', weight: 0.25 },
    ],
    terrain: 'urban',
    bonuses: { turretAccuracy: 0.15, patriotBonus: 0.10 },
  },
};

// Mobile portrait layouts: sea on top, buildings at bottom
const MOBILE = {
  odesa: {
    ...DESKTOP.odesa,
    width: 600,
    height: 900,
    landX: 600, // no vertical sea split; sea is top band
    landY: 200, // sea fills top 200px, land below
    placeZone: { left: 30, right: 570, top: 220, bottom: 870 },
    buildings: [
      { key: 'power', emoji: '⚡', name: 'Електростанція', x: 80, y: 830, maxHp: 200 },
      { key: 'oil', emoji: '🛢️', name: 'Нафтобаза', x: 200, y: 830, maxHp: 150 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 300, y: 860, maxHp: 120 },
      { key: 'comm', emoji: '📡', name: 'Вежа зв\'язку', x: 400, y: 830, maxHp: 100 },
      { key: 'factory', emoji: '🏭', name: 'Завод', x: 520, y: 830, maxHp: 180 },
    ],
    spawnEdges: [{ side: 'top', weight: 1.0 }],
    terrain: 'coastal-portrait',
  },
  kyiv: {
    ...DESKTOP.kyiv,
    width: 600,
    height: 900,
    placeZone: { left: 30, right: 570, top: 30, bottom: 870 },
    buildings: [
      { key: 'rada', emoji: '🏛️', name: 'Верховна Рада', x: 300, y: 520, maxHp: 250 },
      { key: 'energy', emoji: '⚡', name: 'Енергомережа', x: 160, y: 440, maxHp: 200 },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 440, y: 440, maxHp: 120 },
      { key: 'telecom', emoji: '📡', name: 'Телеком-вузол', x: 160, y: 620, maxHp: 100 },
      { key: 'metro', emoji: '🚇', name: 'Метро', x: 440, y: 620, maxHp: 180 },
    ],
    spawnEdges: [
      { side: 'top', weight: 0.5 },
      { side: 'right', weight: 0.3 },
      { side: 'left', weight: 0.2 },
    ],
  },
};

// Select layout based on viewport
export function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export function getCityConfig(cityId) {
  const mobile = isMobileViewport();
  return mobile ? MOBILE[cityId] : DESKTOP[cityId];
}

// For menus (no layout-specific data needed)
export const CITIES = DESKTOP;

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
