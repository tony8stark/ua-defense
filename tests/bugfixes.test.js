import test from 'node:test';
import assert from 'node:assert/strict';

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
