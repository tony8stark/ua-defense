// Enemy type visual properties (constant across difficulties)
export const ENEMY_COLORS = {
  shahed: '#94a3b8',
  shahed238: '#fbbf24',
  geran: '#cbd5e1',
  lancet: '#f87171',
  guided: '#ff6b6b', // operator-guided, red with pulsing eye
  orlan: '#6ee7b7',  // recon drone, green tint
  kalibr: '#38bdf8', // cruise missile, blue
  kh101: '#c084fc',  // air-launched cruise missile, purple
};

export const ENEMY_SIZES = {
  shahed: 14,
  shahed238: 12,
  geran: 11,
  lancet: 9,
  guided: 15, // slightly larger, menacing
  orlan: 10,  // small recon UAV
  kalibr: 16, // large cruise missile
  kh101: 15,  // air-launched cruise missile
};

const ENEMY_RENDER_ANGLE_OFFSETS = {
  // PNG art for Shahed faces the opposite direction from the SVG-based enemy sprites.
  shahed: Math.PI,
};

export function getEnemyRenderAngle(type, angle) {
  return angle + (ENEMY_RENDER_ANGLE_OFFSETS[type] || 0);
}
