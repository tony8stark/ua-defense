import test from 'node:test';
import assert from 'node:assert/strict';

import * as unitData from '../src/data/units.js';

test('repair state allows damaged air defense during a wave but keeps buildings between waves', () => {
  assert.equal(typeof unitData.getRepairActionState, 'function');

  const towerState = unitData.getRepairActionState(
    { type: 'turret', hp: 40, maxHp: 100 },
    { waveActive: true, repairDiscount: 0.5 },
  );
  const buildingState = unitData.getRepairActionState(
    { key: 'power', hp: 40, maxHp: 100 },
    { waveActive: true, repairDiscount: 0.5 },
  );

  assert.deepEqual(towerState, {
    isTower: true,
    damaged: true,
    amount: 60,
    cost: 45,
    allowed: true,
    reason: null,
  });
  assert.deepEqual(buildingState, {
    isTower: false,
    damaged: true,
    amount: 60,
    cost: 45,
    allowed: false,
    reason: 'betweenWaves',
  });
});

test('repair state rejects destroyed or fully healthy units', () => {
  assert.equal(typeof unitData.getRepairActionState, 'function');

  assert.deepEqual(
    unitData.getRepairActionState({ type: 'mvg', hp: 0, maxHp: 56 }, { waveActive: true }),
    {
      isTower: true,
      damaged: false,
      amount: 56,
      cost: 84,
      allowed: false,
      reason: 'destroyed',
    },
  );

  assert.deepEqual(
    unitData.getRepairActionState({ type: 'crew', hp: 62, maxHp: 62 }, { waveActive: true }),
    {
      isTower: true,
      damaged: false,
      amount: 0,
      cost: 0,
      allowed: false,
      reason: 'full',
    },
  );
});

test('destroyed buildings expose an interwave emergency rebuild action instead of a dead end', () => {
  assert.equal(typeof unitData.getRebuildActionState, 'function');

  assert.deepEqual(
    unitData.getRebuildActionState({ key: 'port', hp: 0, maxHp: 200 }, { waveActive: false }),
    {
      rebuildable: true,
      restoreHp: 80,
      cost: 180,
      allowed: true,
      reason: null,
    },
  );

  assert.deepEqual(
    unitData.getRebuildActionState({ key: 'port', hp: 0, maxHp: 200 }, { waveActive: true }),
    {
      rebuildable: true,
      restoreHp: 80,
      cost: 180,
      allowed: false,
      reason: 'betweenWaves',
    },
  );

  assert.deepEqual(
    unitData.getRebuildActionState({ key: 'port', hp: 40, maxHp: 200 }, { waveActive: false }),
    {
      rebuildable: false,
      restoreHp: 0,
      cost: 0,
      allowed: false,
      reason: 'notDestroyed',
    },
  );
});
