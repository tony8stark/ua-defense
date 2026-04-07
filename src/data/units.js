// Defense unit metadata (visuals, names)
export const DEF_META = {
  turret: { name: 'ЗУ Турель', color: '#4ade80', emoji: '🔫' },
  crew: { name: 'Екіпаж FPV', color: '#38bdf8', emoji: '🎮' },
  airfield: { name: 'Аеродром', color: '#f59e0b', emoji: '🛫' },
};

// Per-difficulty unit stats are in difficulty.js
// Upgrade trees will be added in M3

export function getCost(baseCost, escalation, existingCount) {
  return Math.round(baseCost * (1 + escalation * existingCount));
}
