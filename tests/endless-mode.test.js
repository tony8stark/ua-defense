import test from 'node:test';
import assert from 'node:assert/strict';

import { MODES } from '../src/data/difficulty.js';
import { BASE_TICK, TICK, updateTick } from '../src/game/physics.js';
import {
  decodeLeaderboardScore,
  encodeLeaderboardScore,
  sortLeaderboardEntries,
} from '../src/lib/leaderboard.js';
import {
  getEnemySpawnProfile,
  getWaveDef,
  getWaveDisplayTotal,
  hasMoreWaves,
} from '../src/game/waves.js';
import { createGameState } from '../src/game/state.js';

function makeCity(id = 'kyiv') {
  return {
    id,
    width: 900,
    height: 600,
    buildings: [{ key: 'power', name: 'Power', emoji: '⚡', maxHp: 100 }],
    civilianBuildings: [],
  };
}

function totalEnemies(waveDef) {
  return waveDef.en.reduce((sum, group) => sum + group.n, 0);
}

test('kobayashi maru advertises endless progression while classic modes remain finite', () => {
  assert.equal(getWaveDisplayTotal(MODES.kobayashiMaru), '∞');
  assert.equal(hasMoreWaves(MODES.kobayashiMaru, 0), true);
  assert.equal(hasMoreWaves(MODES.kobayashiMaru, 99), true);

  assert.equal(getWaveDisplayTotal(MODES.training), String(MODES.training.waves.length));
  assert.equal(hasMoreWaves(MODES.training, MODES.training.waves.length), false);
});

test('kobayashi maru wave generator escalates pressure over time', () => {
  const early = getWaveDef(MODES.kobayashiMaru, 0, makeCity('kyiv'));
  const late = getWaveDef(MODES.kobayashiMaru, 12, makeCity('odesa'));

  assert.ok(early);
  assert.ok(late);
  assert.ok(totalEnemies(late) > totalEnemies(early), `late wave should be denser: ${totalEnemies(late)} vs ${totalEnemies(early)}`);
  assert.ok(late.d < early.d, `late wave should spawn faster: ${late.d} vs ${early.d}`);
  assert.ok(
    late.en.some(group => ['guided', 'kalibr', 'kh101', 'shahed238'].includes(group.t)),
    `late wave should include heavier pressure types, got ${late.en.map(group => group.t).join(', ')}`,
  );
});

test('kobayashi maru enemy ramp grows threat faster than rewards', () => {
  const mode = MODES.kobayashiMaru;
  const early = getEnemySpawnProfile(mode, 0, 'shahed', mode.shahed);
  const late = getEnemySpawnProfile(mode, 18, 'shahed', mode.shahed);

  const hpGrowth = late.hp / early.hp;
  const rewardGrowth = late.reward / early.reward;

  assert.ok(hpGrowth > rewardGrowth, `attrition should outpace payouts: hp ${hpGrowth} vs reward ${rewardGrowth}`);
  assert.ok(late.speed > early.speed, `late wave should speed up enemies: ${late.speed} vs ${early.speed}`);
  assert.ok(late.dmg > early.dmg, `late wave should hit harder: ${late.dmg} vs ${early.dmg}`);
});

test('updateTick handles endless modes without finite wave arrays', () => {
  const g = createGameState(makeCity('odesa'), MODES.kobayashiMaru);
  g.wave = 18;
  g.enemies = Array.from({ length: 14 }, (_, id) => ({ id }));

  updateTick(g);

  assert.ok(TICK > 0, `tick must stay positive, got ${TICK}`);
  assert.ok(TICK <= BASE_TICK, `tick should only slow down, got ${TICK}`);
});

test('kobayashi maru leaderboard score ranks survival first and preserves displayed score', () => {
  const encoded = encodeLeaderboardScore({
    difficulty: 'kobayashiMaru',
    score: 4821,
    wavesSurvived: 13,
  });

  assert.ok(encoded > 13_000_000, `expected encoded survival-first score, got ${encoded}`);

  const decoded = decodeLeaderboardScore({
    difficulty: 'kobayashiMaru',
    score: encoded,
    waves_survived: 13,
  });

  assert.equal(decoded.primary, 13);
  assert.equal(decoded.secondary, 4821);
});

test('kobayashi maru leaderboard sorting prefers deeper survival over raw score alone', () => {
  const entries = sortLeaderboardEntries([
    { id: 1, difficulty: 'kobayashiMaru', waves_survived: 10, score: encodeLeaderboardScore({ difficulty: 'kobayashiMaru', score: 9500, wavesSurvived: 10 }) },
    { id: 2, difficulty: 'kobayashiMaru', waves_survived: 12, score: encodeLeaderboardScore({ difficulty: 'kobayashiMaru', score: 1200, wavesSurvived: 12 }) },
    { id: 3, difficulty: 'kobayashiMaru', waves_survived: 12, score: encodeLeaderboardScore({ difficulty: 'kobayashiMaru', score: 3200, wavesSurvived: 12 }) },
  ], 'kobayashiMaru');

  assert.deepEqual(entries.map(entry => entry.id), [3, 2, 1]);
});
