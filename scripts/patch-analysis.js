// Patch distribution analysis: run 100 sims per combo, count which patches appear
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
  const { runSimulation } = await import('../src/game/simulation.js');
  const { getLeaderboardPatches, getLeaderboardEntryStats } = await import('../src/lib/leaderboard.js');
  const { encodeLeaderboardScore } = await import('../src/lib/leaderboard.js');

  const SEEDS = 100;
  const cityIds = Object.keys(CITIES);
  const modeIds = Object.keys(MODES);

  for (const modeId of modeIds) {
    const mode = MODES[modeId];
    const maxWaves = Array.isArray(mode.waves) && mode.waves.length > 0 ? mode.waves.length : 15;

    for (const cityId of cityIds) {
      const city = CITIES[cityId];
      if (!city) continue;

      const patchCounts = {};
      const killRates = [];
      const waveCounts = [];
      const killTotals = [];
      const scores = [];
      let noStatsCount = 0;

      for (let seed = 1; seed <= SEEDS; seed++) {
        const result = runSimulation({ city, mode, seed, maxWaves, clearWeather: false });

        const encodedScore = encodeLeaderboardScore({
          difficulty: modeId,
          score: result.score,
          wavesSurvived: result.wavesCompleted,
        });

        const entry = {
          difficulty: modeId,
          city: cityId,
          score: encodedScore,
          waves_survived: result.wavesCompleted,
          kills: result.fairKills,
          total_spawned: result.fairSpawned,
        };

        const stats = getLeaderboardEntryStats(entry);
        if (stats.noStats) noStatsCount++;

        killRates.push(stats.killRate);
        waveCounts.push(result.wavesCompleted);
        killTotals.push(result.kills);
        scores.push(result.score);

        const patches = getLeaderboardPatches(entry);
        for (const p of patches) {
          patchCounts[p.id] = (patchCounts[p.id] || { label: p.label, count: 0 });
          patchCounts[p.id].count++;
        }
      }

      console.log(`\n── ${mode.label} × ${city.name} (${SEEDS} runs) ──`);
      console.log(`  Waves: avg ${(waveCounts.reduce((a, b) => a + b, 0) / SEEDS).toFixed(1)}, median ${waveCounts.sort((a, b) => a - b)[Math.floor(SEEDS / 2)]}`);
      console.log(`  Kills: avg ${(killTotals.reduce((a, b) => a + b, 0) / SEEDS).toFixed(0)}, max ${Math.max(...killTotals)}`);
      console.log(`  Score: avg ${(scores.reduce((a, b) => a + b, 0) / SEEDS).toFixed(0)}, max ${Math.max(...scores)}`);
      console.log(`  noStats entries: ${noStatsCount}/${SEEDS}`);
      console.log(`  Patches:`);

      const sorted = Object.entries(patchCounts).sort(([, a], [, b]) => b.count - a.count);
      for (const [id, { label, count }] of sorted) {
        const pct = (count / SEEDS * 100).toFixed(0);
        const bar = '█'.repeat(Math.round(count / SEEDS * 30));
        console.log(`    ${label.padEnd(24)} ${String(count).padStart(3)}/${SEEDS}  ${pct.padStart(3)}%  ${bar}`);
      }

      // Which patches are NEVER earned?
      const allPatchIds = [
        'training', 'realistic', 'hell', 'endless',
        'absolut', 'sniper', 'cleanSky', 'steadySky',
        'odesa', 'kyiv',
        'century', 'grinder', 'hunter',
        'veteran', 'deepRun', 'hellMarathon', 'longBuild',
        'flash', 'walk', 'chaos', 'bomber', 'pacifist',
      ];
      const missing = allPatchIds.filter(id => !patchCounts[id]);
      if (missing.length > 0) {
        console.log(`  Never earned: ${missing.join(', ')}`);
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
