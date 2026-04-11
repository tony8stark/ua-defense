// Batch simulation runner: tests all mode × city combos
// Usage: node scripts/run-sim.js

// Minimal DOM shims for code that references browser APIs
globalThis.window = { innerWidth: 1200, innerHeight: 800 };
globalThis.document = { createElement: () => ({ getContext: () => null }) };
globalThis.AudioContext = class { constructor() {} };
Object.defineProperty(globalThis, 'navigator', {
  value: { userAgent: '' },
  writable: true,
  configurable: true,
});

async function main() {
  const { MODES } = await import('../src/data/difficulty.js');
  const { CITIES } = await import('../src/data/cities.js');
  const { runBatchSimulation } = await import('../src/game/simulation.js');

  const SEEDS = 50;
  const cityIds = Object.keys(CITIES);
  const modeIds = Object.keys(MODES);

  console.log(`\n=== BALANCE SIMULATION: ${SEEDS} runs per combo ===\n`);

  for (const modeId of modeIds) {
    const mode = MODES[modeId];
    const maxWaves = Array.isArray(mode.waves) && mode.waves.length > 0 ? mode.waves.length : 15;

    for (const cityId of cityIds) {
      const city = CITIES[cityId];
      if (!city) continue;

      const result = runBatchSimulation({
        city,
        mode,
        seeds: SEEDS,
        maxWaves,
        clearWeather: false,
      });

      const winRate = result.results.filter(r => r.ended === 'won').length / result.totalRuns;
      const lostResults = result.results.filter(r => r.ended === 'lost');
      const avgLossWave = lostResults.length > 0
        ? (lostResults.reduce((s, r) => s + (r.lossWave || 0), 0) / lostResults.length).toFixed(1)
        : '-';

      console.log(`── ${mode.label} × ${city.name} (${maxWaves} waves) ──`);
      console.log(`  Win rate:    ${(winRate * 100).toFixed(0)}%`);
      console.log(`  Avg waves:   ${result.avgWavesCompleted.toFixed(1)} / ${maxWaves}`);
      console.log(`  Median:      ${result.medianWavesCompleted}`);
      console.log(`  P10-P90:     ${result.p10WavesCompleted} - ${result.p90WavesCompleted}`);
      console.log(`  Avg bldg HP: ${(result.avgRemainingBuildingHpPct * 100).toFixed(0)}%`);
      console.log(`  Avg loss wave: ${avgLossWave}`);

      // Survival curve key points
      const surv = result.survivalByWave;
      const survPoints = Object.entries(surv)
        .filter(([w]) => {
          const wn = Number(w);
          return wn === 1 || wn === Math.ceil(maxWaves / 4) || wn === Math.ceil(maxWaves / 2) ||
                 wn === Math.ceil(maxWaves * 3 / 4) || wn === maxWaves;
        })
        .map(([w, pct]) => `W${w}:${(pct * 100).toFixed(0)}%`)
        .join('  ');
      console.log(`  Survival:    ${survPoints}`);

      // Loss histogram
      const losses = Object.entries(result.lossHistogram)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([w, n]) => `W${w}:${n}`)
        .join(' ');
      if (losses) console.log(`  Loss dist:   ${losses}`);
      console.log();
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
