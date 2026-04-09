import test from 'node:test';
import assert from 'node:assert/strict';

import { CITIES } from '../src/data/cities.js';
import { MODES } from '../src/data/difficulty.js';
import {
  getDefaultBuildOrder,
  runBatchSimulation,
  runSimulation,
} from '../src/game/simulation.js';

test('headless balance simulation is deterministic for a fixed seed and policy', () => {
  const options = {
    city: CITIES.kyiv,
    mode: MODES.realistic,
    seed: 1337,
    maxWaves: 4,
    clearWeather: true,
  };

  const first = runSimulation(options);
  const second = runSimulation(options);

  assert.deepEqual(first, second);
  assert.equal(first.cityId, 'kyiv');
  assert.equal(first.modeId, 'realistic');
  assert.ok(first.initialBuildCount > 0, `expected opening policy to place units, got ${first.initialBuildCount}`);
  assert.ok(first.wavesCompleted >= 0 && first.wavesCompleted <= 4, `waves completed out of range: ${first.wavesCompleted}`);
});

test('batch simulation summarizes survival thresholds across seeds', () => {
  const summary = runBatchSimulation({
    city: CITIES.odesa,
    mode: MODES.realistic,
    seeds: [11, 12, 13],
    maxWaves: 4,
    clearWeather: true,
  });

  assert.equal(summary.cityId, 'odesa');
  assert.equal(summary.modeId, 'realistic');
  assert.equal(summary.totalRuns, 3);
  assert.equal(summary.results.length, 3);
  assert.ok(summary.avgWavesCompleted >= 0 && summary.avgWavesCompleted <= 4);
  assert.ok(summary.survivalByWave[1] >= summary.survivalByWave[2], `survival should not increase by wave: ${JSON.stringify(summary.survivalByWave)}`);
  assert.ok(summary.survivalByWave[2] >= summary.survivalByWave[3], `survival should not increase by wave: ${JSON.stringify(summary.survivalByWave)}`);
});

test('realistic baseline survives wave four often enough to keep the mode learnable', () => {
  const kyiv = runBatchSimulation({
    city: CITIES.kyiv,
    mode: MODES.realistic,
    seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    maxWaves: 4,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('kyiv'),
  });
  const odesa = runBatchSimulation({
    city: CITIES.odesa,
    mode: MODES.realistic,
    seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    maxWaves: 4,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('odesa'),
  });

  assert.ok(kyiv.survivalByWave[4] >= 0.5, `kyiv realistic wave 4 survival is still too brittle: ${kyiv.survivalByWave[4]}`);
  assert.ok(odesa.survivalByWave[4] >= 0.5, `odesa realistic wave 4 survival is still too brittle: ${odesa.survivalByWave[4]}`);
});

test('realistic wave five is no longer a hard wall immediately after the early-game fix', () => {
  const kyiv = runBatchSimulation({
    city: CITIES.kyiv,
    mode: MODES.realistic,
    seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    maxWaves: 5,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('kyiv'),
  });
  const odesa = runBatchSimulation({
    city: CITIES.odesa,
    mode: MODES.realistic,
    seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    maxWaves: 5,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('odesa'),
  });

  assert.ok(kyiv.survivalByWave[5] >= 0.16, `kyiv realistic wave 5 still behaves like a hard wall: ${kyiv.survivalByWave[5]}`);
  assert.ok(odesa.survivalByWave[5] >= 0.16, `odesa realistic wave 5 still behaves like a hard wall: ${odesa.survivalByWave[5]}`);
});

test('realistic does not hit the true survival cliff until waves seven and eight', () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const kyiv = runBatchSimulation({
    city: CITIES.kyiv,
    mode: MODES.realistic,
    seeds,
    maxWaves: 8,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('kyiv'),
  });
  const odesa = runBatchSimulation({
    city: CITIES.odesa,
    mode: MODES.realistic,
    seeds,
    maxWaves: 8,
    clearWeather: true,
    buildOrder: getDefaultBuildOrder('odesa'),
  });

  assert.ok(kyiv.survivalByWave[5] >= 0.33, `kyiv realistic should stay comfortably above the cliff through wave 5: ${kyiv.survivalByWave[5]}`);
  assert.ok(odesa.survivalByWave[5] >= 0.33, `odesa realistic should stay comfortably above the cliff through wave 5: ${odesa.survivalByWave[5]}`);
  assert.ok(kyiv.survivalByWave[7] >= 0.22, `kyiv realistic should keep the low-survival zone closer to wave 7: ${kyiv.survivalByWave[7]}`);
  assert.ok(odesa.survivalByWave[7] >= 0.22, `odesa realistic should keep the low-survival zone closer to wave 7: ${odesa.survivalByWave[7]}`);
  assert.ok(kyiv.survivalByWave[8] > 0, `kyiv realistic should still leave a few runs alive into wave 8: ${kyiv.survivalByWave[8]}`);
  assert.ok(odesa.survivalByWave[8] > 0, `odesa realistic should still leave a few runs alive into wave 8: ${odesa.survivalByWave[8]}`);
});
