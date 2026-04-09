import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { MODES } from '../src/data/difficulty.js';
import { getEWMultipliers } from '../src/game/events.js';
import { flatWave } from '../src/game/spawner.js';
import { getEnemySpawnProfile, getWaveDef } from '../src/game/waves.js';
import { shouldRevealStealthEnemy } from '../src/game/stealth.js';
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

function summarizeWaveThreat(mode, waveIndex, cityId = 'kyiv') {
  const city = {
    id: cityId,
    width: 900,
    height: 600,
    buildings: [{ key: 'power', name: 'Power', maxHp: 100 }],
    civilianBuildings: [],
  };
  const wave = getWaveDef(mode, waveIndex, city);
  let totalHp = 0;
  let totalDmg = 0;
  let totalReward = 0;

  for (const group of wave.en) {
    const profile = getEnemySpawnProfile(mode, waveIndex, group.t, mode[group.t]);
    totalHp += (profile.hp || 0) * group.n;
    totalDmg += (profile.dmg || 0) * group.n;
    totalReward += (profile.reward || 0) * group.n;
  }

  return {
    wave,
    totalHp,
    totalDmg,
    totalReward,
    pressure: totalHp / wave.d + totalDmg / 18,
  };
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

test('realistic mode now sits close to hell on efficiency and late-wave pressure', () => {
  const units = ['turret', 'mvg', 'crew', 'airfield', 'hawk', 'gepard', 'irist'];
  const sumScores = (mode) => units.reduce((sum, unit) => sum + getUnitBalanceScore(mode, unit), 0);

  const trainingSum = sumScores(MODES.training);
  const realisticSum = sumScores(MODES.realistic);
  const hellSum = sumScores(MODES.hell);
  const realisticFinal = summarizeWaveThreat(MODES.realistic, MODES.realistic.waves.length - 1);
  const hellFinal = summarizeWaveThreat(MODES.hell, MODES.hell.waves.length - 1);

  assert.ok(realisticSum < trainingSum * 0.7, `realistic defense ceiling too high: ${realisticSum} vs ${trainingSum}`);
  assert.ok(realisticSum <= hellSum * 1.02, `realistic should not keep so much extra defense slack over hell: ${realisticSum} vs ${hellSum}`);
  assert.ok(realisticSum >= hellSum * 0.94, `realistic should stay near hell rather than collapsing below it: ${realisticSum} vs ${hellSum}`);
  assert.ok(MODES.realistic.startMoney < 400, `realistic should start tighter than before: ${MODES.realistic.startMoney}`);
  assert.ok(MODES.realistic.waveBonus <= 55, `realistic wave bonus should stay restrained even after recovery tuning: ${MODES.realistic.waveBonus}`);
  assert.ok(MODES.realistic.costEsc >= 0.15, `realistic should escalate unit costs faster: ${MODES.realistic.costEsc}`);
  assert.ok(realisticFinal.pressure >= hellFinal.pressure * 0.95, `realistic finale should pressure close to hell: ${realisticFinal.pressure} vs ${hellFinal.pressure}`);
  assert.ok(getUnitBalanceScore(MODES.realistic, 'hawk') <= 1.25, `realistic hawk too dominant: ${getUnitBalanceScore(MODES.realistic, 'hawk')}`);
  assert.ok(getUnitBalanceScore(MODES.realistic, 'gepard') <= 1.85, `realistic gepard too dominant: ${getUnitBalanceScore(MODES.realistic, 'gepard')}`);
});

test('realistic opener gives breathing room before full pressure arrives', () => {
  const waveOne = summarizeWaveThreat(MODES.realistic, 0);
  const waveTwo = summarizeWaveThreat(MODES.realistic, 1);
  const waveThree = summarizeWaveThreat(MODES.realistic, 2);

  assert.ok(waveOne.wave.d >= 58, `wave 1 should spawn slower so players can settle in: ${waveOne.wave.d}`);
  assert.ok(waveTwo.wave.d >= 52, `wave 2 should still leave reaction time: ${waveTwo.wave.d}`);
  assert.ok(waveThree.wave.d >= 46, `wave 3 should not front-load realistic into hell tempo: ${waveThree.wave.d}`);
  assert.ok(waveOne.totalDmg <= 190, `wave 1 should not delete a building in one sloppy opener: ${waveOne.totalDmg}`);
  assert.ok(waveTwo.totalDmg <= 380, `wave 2 should stay below the old shock spike: ${waveTwo.totalDmg}`);
  assert.ok(waveThree.totalDmg <= 650, `wave 3 should still teach the mode instead of ending the run outright: ${waveThree.totalDmg}`);
});

test('realistic early enemy softening now stretches into the midgame before fully burning off', () => {
  const openingShahed = getEnemySpawnProfile(MODES.realistic, 0, 'shahed', MODES.realistic.shahed);
  const midIntroShahed = getEnemySpawnProfile(MODES.realistic, 3, 'shahed', MODES.realistic.shahed);
  const lateIntroShahed = getEnemySpawnProfile(MODES.realistic, 6, 'shahed', MODES.realistic.shahed);
  const fullShahed = getEnemySpawnProfile(MODES.realistic, 9, 'shahed', MODES.realistic.shahed);
  const introLancet = getEnemySpawnProfile(MODES.realistic, 3, 'lancet', MODES.realistic.lancet);
  const lateIntroLancet = getEnemySpawnProfile(MODES.realistic, 6, 'lancet', MODES.realistic.lancet);
  const fullLancet = getEnemySpawnProfile(MODES.realistic, 9, 'lancet', MODES.realistic.lancet);

  assert.ok(openingShahed.dmg < MODES.realistic.shahed.dmg, `opening shaheds should hit softer than base realistic: ${openingShahed.dmg}`);
  assert.ok(midIntroShahed.dmg < MODES.realistic.shahed.dmg, `wave 4 shaheds should still be slightly softened: ${midIntroShahed.dmg}`);
  assert.ok(lateIntroShahed.dmg < MODES.realistic.shahed.dmg, `wave 7 shaheds should still keep a little onboarding slack: ${lateIntroShahed.dmg}`);
  assert.equal(fullShahed.dmg, MODES.realistic.shahed.dmg);
  assert.ok(introLancet.dmg < MODES.realistic.lancet.dmg, `early lancets should not arrive at full brutality: ${introLancet.dmg}`);
  assert.ok(lateIntroLancet.dmg < MODES.realistic.lancet.dmg, `wave 7 lancets should still keep a little onboarding slack: ${lateIntroLancet.dmg}`);
  assert.equal(fullLancet.dmg, MODES.realistic.lancet.dmg);
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

test('EW scales by difficulty without deleting FPV play in realistic', () => {
  const trainingEW = getEWMultipliers({ ewActive: { timer: 1 }, mode: MODES.training });
  const realisticEW = getEWMultipliers({ ewActive: { timer: 1 }, mode: MODES.realistic });
  const hellEW = getEWMultipliers({ ewActive: { timer: 1 }, mode: MODES.hell });

  const realisticLossRate = MODES.realistic.crew.lossChance * realisticEW.fpvLossMul;
  const hellLossRate = MODES.hell.crew.lossChance * hellEW.fpvLossMul;

  assert.ok(trainingEW.fpvLossMul < realisticEW.fpvLossMul, `training EW should be softer than realistic: ${trainingEW.fpvLossMul} vs ${realisticEW.fpvLossMul}`);
  assert.ok(realisticEW.fpvLossMul < hellEW.fpvLossMul, `realistic EW should stay below hell: ${realisticEW.fpvLossMul} vs ${hellEW.fpvLossMul}`);
  assert.ok(realisticLossRate < 0.5, `realistic EW should disrupt FPV, not shut it off: ${realisticLossRate}`);
  assert.ok(hellLossRate > realisticLossRate, `hell EW should remain harsher than realistic: ${hellLossRate} vs ${realisticLossRate}`);
  assert.ok(realisticEW.kukurznikAccMul >= 0.6, `realistic EW should not collapse airfield accuracy completely: ${realisticEW.kukurznikAccMul}`);
});

test('iskander scramble is single-use and updates mobile patrol anchors', () => {
  const appSource = readFileSync(resolve('src/App.jsx'), 'utf8');

  assert.match(appSource, /iw\.scrambled\)\s*return/, 'scramble should stop repeated reposition abuse on the same warning');
  assert.match(appSource, /iw\.scrambled\s*=\s*true/, 'scramble should mark the warning as consumed after the first evacuation');
  assert.match(appSource, /t\.type === 'mvg'/, 'scramble should handle mobile patrol units explicitly');
  assert.match(appSource, /t\.originX\s*=\s*t\.x/, 'scramble should update MVG patrol origin after evacuation');
  assert.match(appSource, /t\.originY\s*=\s*t\.y/, 'scramble should update MVG patrol origin after evacuation');
});

test('tutorial copy explains one-shot iskander scramble and FPV blind spots', () => {
  const tutorialSource = readFileSync(resolve('src/ui/Tutorial.jsx'), 'utf8');

  assert.match(tutorialSource, /лише один раз/, 'tutorial should warn that Iskander evacuation is a one-shot response');
  assert.match(tutorialSource, /не бачать реактивні Shahed-238/, 'tutorial should mention that FPV crews cannot target Shahed-238');
});

test('low-flying shahed can stay hidden deep into the map and only pop up near the target', () => {
  const city = {
    id: 'kyiv',
    width: 900,
    height: 600,
    buildings: [{ key: 'center', name: 'Center', x: 820, y: 300, maxHp: 100 }],
    civilianBuildings: [],
  };
  const mode = {
    startMoney: 400,
    waves: [{ en: [], d: 50 }],
    iskander: { interval: [100, 120] },
  };
  const g = createGameState(city, mode);
  g.weather = { id: 'clear', effects: {} };

  g.towers.push({ id: 1, type: 'turret', x: 260, y: 300, hp: 100, maxHp: 100 });

  const hiddenMidCity = {
    id: 10,
    type: 'shahed',
    x: 330,
    y: 300,
    hp: 70,
    maxHp: 70,
    stealth: true,
    target: { mode: 'building', key: 'center' },
  };
  const nearTarget = {
    ...hiddenMidCity,
    x: 700,
  };

  assert.equal(
    shouldRevealStealthEnemy(g, hiddenMidCity),
    false,
    'low-flying shahed should stay hidden after crossing into defended airspace if it is still far from the target',
  );
  assert.equal(
    shouldRevealStealthEnemy(g, nearTarget),
    true,
    'low-flying shahed should reveal once it is closing on the final target area',
  );
});
