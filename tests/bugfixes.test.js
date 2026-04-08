import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getEnemyRenderAngle } from '../src/data/enemies.js';
import { getRepairCost } from '../src/data/units.js';
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
