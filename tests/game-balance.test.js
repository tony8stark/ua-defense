import test from 'node:test';
import assert from 'node:assert/strict';

import { MODES } from '../src/data/difficulty.js';
import { flatWave } from '../src/game/spawner.js';
import {
  createGameState,
  registerUnit,
  markUnitDestroyed,
  trackUnitSpend,
  trackUnitRefund,
  trackRepairSpend,
  recordUnitKill,
  getBalanceTelemetry,
} from '../src/game/state.js';
import { getUnitBalanceScore } from '../src/data/units.js';

function createFixtureState() {
  const city = {
    id: 'odesa',
    width: 900,
    height: 600,
    buildings: [{ key: 'power', name: 'Power', maxHp: 100 }],
    civilianBuildings: [],
  };
  const mode = {
    startMoney: 400,
    waves: [{ en: [], d: 50 }],
    iskander: { interval: [100, 120] },
  };
  return createGameState(city, mode);
}

function withMockRandom(value, fn) {
  const originalRandom = Math.random;
  Math.random = typeof value === 'function' ? value : () => value;
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function countTypes(sequence) {
  return sequence.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

const PRESSURE = {
  shahed: 1,
  geran: 1,
  orlan: 2,
  lancet: 2,
  shahed238: 2,
  guided: 3,
  kalibr: 3,
  kh101: 3,
};

test('balance telemetry keeps spend, refunds, repairs, and unit kills after losses', () => {
  const g = createFixtureState();

  const turret = { id: 1, type: 'turret', callsign: 'Alpha', kills: 0, hp: 100, maxHp: 100 };
  const crew = { id: 2, type: 'crew', callsign: 'Bravo', kills: 0, hp: 70, maxHp: 70 };

  g.towers.push(turret, crew);
  registerUnit(g, turret);
  registerUnit(g, crew);

  trackUnitSpend(g, 'turret', 50, 'purchase');
  trackUnitSpend(g, 'turret', 40, 'upgrade');
  trackUnitSpend(g, 'crew', 80, 'purchase');
  trackUnitRefund(g, 'turret', 30);
  trackRepairSpend(g, 'power', 45);

  recordUnitKill(g, turret.id);
  recordUnitKill(g, turret.id);
  recordUnitKill(g, crew.id);

  markUnitDestroyed(g, turret.id);
  g.towers = [crew];
  g.civilianHits = 2;
  g.trivogaUses = 1;

  const telemetry = getBalanceTelemetry(g);

  assert.equal(telemetry.economy.totalSpent, 170);
  assert.equal(telemetry.economy.totalRefund, 30);
  assert.equal(telemetry.economy.repairSpent, 45);
  assert.equal(telemetry.economy.netSpent, 185);
  assert.equal(telemetry.byType.turret.kills, 2);
  assert.equal(telemetry.byType.turret.destroyed, 1);
  assert.equal(telemetry.byType.turret.netSpend, 60);
  assert.equal(telemetry.byType.crew.kills, 1);
  assert.equal(telemetry.byType.crew.alive, 1);
  assert.equal(telemetry.civilianHits, 2);
  assert.equal(telemetry.trivogaUses, 1);
});

test('crew and airfield stay above minimum efficiency floors', () => {
  for (const mode of Object.values(MODES)) {
    const turretScore = getUnitBalanceScore(mode, 'turret');
    const crewScore = getUnitBalanceScore(mode, 'crew');
    const airfieldScore = getUnitBalanceScore(mode, 'airfield');

    assert.ok(crewScore >= turretScore * 0.45, `crew floor failed: ${crewScore} vs ${turretScore}`);
    assert.ok(airfieldScore >= turretScore * 0.29, `airfield floor failed: ${airfieldScore} vs ${turretScore}`);
  }
});

test('mvg keeps its fast-target niche and gepard stays within specialist bounds', () => {
  for (const mode of Object.values(MODES)) {
    const turretScore = getUnitBalanceScore(mode, 'turret');
    const mvgFastScore = getUnitBalanceScore(mode, 'mvg', { antiFast: true });
    const hawkScore = getUnitBalanceScore(mode, 'hawk');
    const gepardScore = getUnitBalanceScore(mode, 'gepard');

    assert.ok(mvgFastScore > turretScore, `mvg anti-fast niche failed: ${mvgFastScore} vs ${turretScore}`);
    assert.ok(gepardScore <= hawkScore * 2.2, `gepard specialist bound failed: ${gepardScore} vs ${hawkScore}`);
  }
});

test('realistic mode keeps defense output meaningfully below training without collapsing into hell', () => {
  const units = ['turret', 'mvg', 'crew', 'airfield', 'hawk', 'gepard', 'irist'];
  const sumScores = (mode) => units.reduce((sum, unit) => sum + getUnitBalanceScore(mode, unit), 0);

  const trainingSum = sumScores(MODES.training);
  const realisticSum = sumScores(MODES.realistic);
  const hellSum = sumScores(MODES.hell);

  assert.ok(realisticSum < trainingSum * 0.7, `realistic defense ceiling too high: ${realisticSum} vs ${trainingSum}`);
  assert.ok(realisticSum > hellSum, `realistic should stay above hell baseline: ${realisticSum} vs ${hellSum}`);
  assert.ok(getUnitBalanceScore(MODES.realistic, 'hawk') <= 1.25, `realistic hawk too dominant: ${getUnitBalanceScore(MODES.realistic, 'hawk')}`);
  assert.ok(getUnitBalanceScore(MODES.realistic, 'gepard') <= 1.85, `realistic gepard too dominant: ${getUnitBalanceScore(MODES.realistic, 'gepard')}`);
});

test('flatWave preserves counts while breaking front-loaded shock groups', () => {
  const waveDef = {
    en: [
      { t: 'guided', n: 2 },
      { t: 'kalibr', n: 2 },
      { t: 'lancet', n: 3 },
      { t: 'shahed', n: 8 },
    ],
  };

  const sequence = withMockRandom(0.999, () => flatWave(waveDef));

  assert.deepEqual(countTypes(sequence), { guided: 2, kalibr: 2, lancet: 3, shahed: 8 });
  assert.ok(
    sequence.slice(0, 4).some(type => PRESSURE[type] <= 1),
    `expected at least one lower-pressure target early, got ${sequence.slice(0, 4).join(', ')}`,
  );
});

test('flatWave prevents long shock streaks when calmer targets exist', () => {
  const waveDef = {
    en: [
      { t: 'lancet', n: 4 },
      { t: 'shahed238', n: 3 },
      { t: 'shahed', n: 8 },
      { t: 'geran', n: 3 },
    ],
  };

  const sequence = withMockRandom(0.999, () => flatWave(waveDef));

  let maxShockRun = 0;
  let currentShockRun = 0;
  for (const type of sequence) {
    if ((PRESSURE[type] || 1) >= 2) {
      currentShockRun++;
      maxShockRun = Math.max(maxShockRun, currentShockRun);
    } else {
      currentShockRun = 0;
    }
  }

  assert.ok(maxShockRun <= 2, `expected shock streak <= 2, got ${maxShockRun} in ${sequence.join(', ')}`);
});

test('flatWave keeps fully shock-heavy waves oppressive when no calmer targets exist', () => {
  const waveDef = {
    en: [
      { t: 'guided', n: 2 },
      { t: 'kalibr', n: 2 },
      { t: 'lancet', n: 4 },
    ],
  };

  const sequence = withMockRandom(0.999, () => flatWave(waveDef));

  assert.deepEqual(countTypes(sequence), { guided: 2, kalibr: 2, lancet: 4 });
  assert.ok(
    sequence.slice(0, 4).every(type => (PRESSURE[type] || 1) >= 2),
    `expected oppressive opener to remain possible, got ${sequence.slice(0, 4).join(', ')}`,
  );
});
