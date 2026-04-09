import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { setMuted } from '../src/audio/SoundManager.js';
import { getEnemyRenderAngle } from '../src/data/enemies.js';
import { getRepairCost } from '../src/data/units.js';
import { updateCombat } from '../src/game/combat.js';
import { createTouchPressState, finishTouchPress } from '../src/game/touch.js';

test('getRepairCost applies repair discount consistently', () => {
  const building = { hp: 90, maxHp: 150 };

  assert.equal(getRepairCost(building), 90);
  assert.equal(getRepairCost(building, { repairDiscount: 0.5 }), 45);
});

test('createTouchPressState stores timer id and event separately', () => {
  const evt = { clientX: 100, clientY: 240 };
  let scheduledDelay = null;
  let longPressEvt = null;
  let scheduledCallback = null;

  const state = createTouchPressState(evt, {
    delayMs: 300,
    schedule(fn, delay) {
      scheduledCallback = fn;
      scheduledDelay = delay;
      return 123;
    },
    onLongPress(nextEvt) {
      longPressEvt = nextEvt;
    },
  });

  assert.equal(state.timerId, 123);
  assert.deepEqual(state.evt, evt);
  assert.equal(scheduledDelay, 300);

  scheduledCallback();

  assert.deepEqual(longPressEvt, evt);
});

test('finishTouchPress clears timer and dispatches tap event once', () => {
  const evt = { clientX: 32, clientY: 64 };
  const state = { evt, timerId: 77 };
  let clearedTimerId = null;
  let tapEvt = null;

  const handled = finishTouchPress(state, {
    clear(timerId) {
      clearedTimerId = timerId;
    },
    onTap(nextEvt) {
      tapEvt = nextEvt;
    },
  });

  assert.equal(handled, true);
  assert.equal(clearedTimerId, 77);
  assert.deepEqual(tapEvt, evt);
});

test('fullscreen menu-like screens use a constrained scroll shell', () => {
  const files = [
    'src/ui/MainMenu.jsx',
    'src/ui/DifficultySelect.jsx',
    'src/ui/Leaderboard.jsx',
    'src/ui/TechPage.jsx',
    'src/ui/ResultsScreen.jsx',
  ];

  for (const file of files) {
    const source = readFileSync(resolve(file), 'utf8');

    assert.match(source, /height:\s*'100dvh'/, `${file} should constrain itself to the viewport height`);
    assert.match(source, /overflowY:\s*'auto'/, `${file} should enable its own vertical scrolling`);
    assert.doesNotMatch(source, /minHeight:\s*'100dvh'/, `${file} should not rely on minHeight for a scroll shell`);
  }
});

test('shahed render angle compensates for png forward direction', () => {
  assert.equal(getEnemyRenderAngle('shahed', 0), Math.PI);
  assert.equal(getEnemyRenderAngle('shahed', Math.PI / 2), Math.PI * 1.5);
  assert.equal(getEnemyRenderAngle('geran', 0), 0);
  assert.equal(getEnemyRenderAngle('lancet', Math.PI), Math.PI);
});

test('leaderboard uses normalized stat cards and patch labels instead of inline icon-number strings', () => {
  const uiSource = readFileSync(resolve('src/ui/Leaderboard.jsx'), 'utf8');
  const helperSource = readFileSync(resolve('src/lib/leaderboard.js'), 'utf8');

  assert.match(helperSource, /% збиття/, 'leaderboard helper should expose interception percentage');
  assert.match(uiSource, /Патчі/, 'leaderboard should render patch labels for runs');
  assert.match(uiSource, /getLeaderboardEntryStats/, 'leaderboard should consume normalized stat helpers');
  assert.doesNotMatch(uiSource, /`🌊\$\{/, 'leaderboard should not concatenate wave glyphs directly into score strings anymore');
  assert.doesNotMatch(uiSource, /`🏅\$\{/, 'leaderboard should not concatenate score glyphs directly into stat strings anymore');
});

test('results screen keeps the roster panel from shrinking away on short viewports', () => {
  const source = readFileSync(resolve('src/ui/ResultsScreen.jsx'), 'utf8');

  assert.match(source, /Особовий склад/, 'results screen should still render the roster section');
  assert.match(source, /maxHeight:\s*'35dvh'/, 'roster section should stay capped instead of growing forever');
  assert.match(source, /flexShrink:\s*0/, 'results screen cards should opt out of flex shrinking on short viewports');
});

test('combat only counts one kill when multiple shots land on the same target in one tick', () => {
  setMuted(true);
  const g = {
    mode: {},
    wave: 3,
    tick: 0,
    weather: { effects: {} },
    ewActive: null,
    trivogaActive: 0,
    city: { width: 800, height: 600 },
    buildings: [],
    towers: [],
    kukurzniki: [],
    enemies: [
      { id: 1, type: 'shahed', hp: 5, maxHp: 5, reward: 3, x: 120, y: 80, color: '#fff' },
    ],
    projectiles: [
      { id: 11, tid: 1, x: 120, y: 80, tx: 120, ty: 80, speed: 10, damage: 5, hitChance: 1 },
      { id: 12, tid: 1, x: 120, y: 80, tx: 120, ty: 80, speed: 10, damage: 5, hitChance: 1 },
    ],
    friendlyDrones: [],
    explosions: [],
    particles: [],
    floats: [],
    logs: [],
    money: 0,
    score: 0,
    killed: 0,
    killedByType: { shahed: 0 },
    comboCount: 0,
    comboTimer: 0,
    bestCombo: 0,
  };

  updateCombat(g);

  assert.equal(g.killed, 1, 'duplicate hits on a dead target should not award multiple kills');
  assert.equal(g.money, 3, 'reward should only be granted once');
  assert.equal(g.score, 3, 'score should only be granted once');
  assert.equal(g.killedByType.shahed, 1, 'type breakdown should stay aligned with real kills');
});
