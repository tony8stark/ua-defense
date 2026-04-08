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
    hints: ['🌊 Вороги тільки зі сходу', '⚓ Порт дає бонус грошей', '⚡ Кожна будівля дає бонус'],
    width: 900,
    height: 600,
    landX: 620,
    placeZone: { left: 80, right: 590 },
    buildings: [
      { key: 'port', emoji: '⚓', name: 'Порт', x: 120, y: 500, maxHp: 200, bonus: { type: 'waveBonus', value: 15, desc: '+15💰 за хвилю' } },
      { key: 'power', emoji: '⚡', name: 'Електростанція', x: 50, y: 120, maxHp: 180, bonus: { type: 'range', value: 0.08, desc: '+8% дальність' } },
      { key: 'oil', emoji: '🛢️', name: 'Нафтобаза', x: 300, y: 80, maxHp: 150, bonus: { type: 'damage', value: 0.10, desc: '+10% урон' } },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 50, y: 350, maxHp: 120, bonus: { type: 'repair', value: 0.5, desc: 'Ремонт -50% вартість' } },
      { key: 'comm', emoji: '📡', name: 'Вежа зв\'язку', x: 300, y: 450, maxHp: 100, bonus: { type: 'accuracy', value: 0.05, desc: '+5% точність' } },
    ],
    terrainTiles: [
      { type: 'elevation', x: 420, y: 150, label: 'Висота' },
      { type: 'elevation', x: 180, y: 280, label: 'Висота' },
      { type: 'bunker', x: 500, y: 350, label: 'Бліндаж' },
      { type: 'bunker', x: 350, y: 530, label: 'Бліндаж' },
    ],
    civilianBuildings: [
      { x: 200, y: 160, emoji: '🏠' }, { x: 400, y: 100, emoji: '🏢' },
      { x: 160, y: 420, emoji: '🏠' }, { x: 480, y: 250, emoji: '🏠' },
      { x: 350, y: 320, emoji: '🏢' }, { x: 100, y: 240, emoji: '🏠' },
      { x: 500, y: 480, emoji: '🏠' }, { x: 260, y: 550, emoji: '🏢' },
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
    hints: ['📍 Атака з кількох напрямків', '⚡ Кожна будівля дає бонус', '🎯 Patriot +15% точність турелей'],
    width: 900,
    height: 600,
    landX: 900,
    placeZone: { left: 40, right: 860 },
    buildings: [
      { key: 'rada', emoji: '🏛️', name: 'Верховна Рада', x: 450, y: 280, maxHp: 250, bonus: { type: 'waveBonus', value: 12, desc: '+12💰 за хвилю' } },
      { key: 'energy', emoji: '⚡', name: 'Енергомережа', x: 350, y: 180, maxHp: 200, bonus: { type: 'range', value: 0.08, desc: '+8% дальність' } },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 550, y: 180, maxHp: 120, bonus: { type: 'repair', value: 0.5, desc: 'Ремонт -50% вартість' } },
      { key: 'telecom', emoji: '📡', name: 'Телеком-вузол', x: 350, y: 380, maxHp: 100, bonus: { type: 'accuracy', value: 0.05, desc: '+5% точність' } },
      { key: 'metro', emoji: '🚇', name: 'Метро', x: 550, y: 380, maxHp: 180, bonus: { type: 'damage', value: 0.10, desc: '+10% урон' } },
    ],
    terrainTiles: [
      { type: 'elevation', x: 200, y: 130, label: 'Висота' },
      { type: 'elevation', x: 650, y: 450, label: 'Висота' },
      { type: 'bunker', x: 150, y: 350, label: 'Бліндаж' },
      { type: 'bunker', x: 700, y: 200, label: 'Бліндаж' },
    ],
    civilianBuildings: [
      { x: 280, y: 100, emoji: '🏢' }, { x: 620, y: 120, emoji: '🏠' },
      { x: 180, y: 230, emoji: '🏠' }, { x: 680, y: 300, emoji: '🏢' },
      { x: 250, y: 450, emoji: '🏠' }, { x: 500, y: 500, emoji: '🏠' },
      { x: 400, y: 140, emoji: '🏢' }, { x: 600, y: 480, emoji: '🏠' },
      { x: 130, y: 500, emoji: '🏠' }, { x: 750, y: 400, emoji: '🏢' },
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
      { key: 'port', emoji: '⚓', name: 'Порт', x: 300, y: 850, maxHp: 200, bonus: { type: 'waveBonus', value: 15, desc: '+15💰 за хвилю' } },
      { key: 'power', emoji: '⚡', name: 'Електростанція', x: 100, y: 750, maxHp: 180, bonus: { type: 'range', value: 0.08, desc: '+8% дальність' } },
      { key: 'oil', emoji: '🛢️', name: 'Нафтобаза', x: 500, y: 750, maxHp: 150, bonus: { type: 'damage', value: 0.10, desc: '+10% урон' } },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 100, y: 860, maxHp: 120, bonus: { type: 'repair', value: 0.5, desc: 'Ремонт -50% вартість' } },
      { key: 'comm', emoji: '📡', name: 'Вежа зв\'язку', x: 500, y: 860, maxHp: 100, bonus: { type: 'accuracy', value: 0.05, desc: '+5% точність' } },
    ],
    terrainTiles: [
      { type: 'elevation', x: 300, y: 350, label: 'Висота' },
      { type: 'elevation', x: 150, y: 550, label: 'Висота' },
      { type: 'bunker', x: 450, y: 500, label: 'Бліндаж' },
      { type: 'bunker', x: 200, y: 700, label: 'Бліндаж' },
    ],
    civilianBuildings: [
      { x: 200, y: 300, emoji: '🏠' }, { x: 400, y: 400, emoji: '🏢' },
      { x: 100, y: 500, emoji: '🏠' }, { x: 500, y: 600, emoji: '🏠' },
      { x: 300, y: 650, emoji: '🏢' }, { x: 450, y: 300, emoji: '🏠' },
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
      { key: 'rada', emoji: '🏛️', name: 'Верховна Рада', x: 300, y: 520, maxHp: 250, bonus: { type: 'waveBonus', value: 12, desc: '+12💰 за хвилю' } },
      { key: 'energy', emoji: '⚡', name: 'Енергомережа', x: 160, y: 440, maxHp: 200, bonus: { type: 'range', value: 0.08, desc: '+8% дальність' } },
      { key: 'hospital', emoji: '🏥', name: 'Лікарня', x: 440, y: 440, maxHp: 120, bonus: { type: 'repair', value: 0.5, desc: 'Ремонт -50% вартість' } },
      { key: 'telecom', emoji: '📡', name: 'Телеком-вузол', x: 160, y: 620, maxHp: 100, bonus: { type: 'accuracy', value: 0.05, desc: '+5% точність' } },
      { key: 'metro', emoji: '🚇', name: 'Метро', x: 440, y: 620, maxHp: 180, bonus: { type: 'damage', value: 0.10, desc: '+10% урон' } },
    ],
    terrainTiles: [
      { type: 'elevation', x: 150, y: 200, label: 'Висота' },
      { type: 'elevation', x: 450, y: 750, label: 'Висота' },
      { type: 'bunker', x: 400, y: 300, label: 'Бліндаж' },
      { type: 'bunker', x: 200, y: 700, label: 'Бліндаж' },
    ],
    civilianBuildings: [
      { x: 300, y: 200, emoji: '🏢' }, { x: 480, y: 300, emoji: '🏠' },
      { x: 120, y: 400, emoji: '🏠' }, { x: 400, y: 550, emoji: '🏢' },
      { x: 250, y: 700, emoji: '🏠' }, { x: 500, y: 800, emoji: '🏠' },
      { x: 350, y: 350, emoji: '🏢' }, { x: 150, y: 600, emoji: '🏠' },
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
