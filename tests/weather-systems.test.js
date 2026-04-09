import test from 'node:test';
import assert from 'node:assert/strict';

import { GRID } from '../src/data/cities.js';
import { MODES } from '../src/data/difficulty.js';
import {
  getWeatherPool,
  getWeatherAccuracyMultiplier,
  getWeatherEnemyMissChance,
  getWeatherEnemySpeedMultiplier,
  getWeatherVisualProfile,
} from '../src/game/events.js';
import { createGameState } from '../src/game/state.js';
import { getStealthRevealConfig, shouldRevealStealthEnemy } from '../src/game/stealth.js';

test('fog shrinks stealth reveal ranges so low-flying targets stay hidden longer', () => {
  assert.equal(typeof getWeatherEnemySpeedMultiplier, 'function');

  const city = {
    id: 'kyiv',
    width: 900,
    height: 600,
    buildings: [{ key: 'center', name: 'Center', x: 820, y: 300, maxHp: 100 }],
    civilianBuildings: [],
  };
  const mode = { ...MODES.realistic, waves: [{ en: [], d: 50 }] };
  const clearGame = createGameState(city, mode);
  const fogGame = createGameState(city, mode);
  const reveal = getStealthRevealConfig('shahed');
  const enemy = {
    id: 10,
    type: 'shahed',
    y: 300,
    hp: 70,
    maxHp: 70,
    stealth: true,
    target: { mode: 'building', key: 'center' },
    x: 820 - reveal.targetApproachRadius + GRID * 0.5,
  };

  clearGame.weather = { id: 'clear', effects: {} };
  fogGame.weather = { id: 'fog', effects: { rangeMul: 0.7, stealthRevealMul: 0.58 } };

  assert.equal(shouldRevealStealthEnemy(clearGame, enemy), true);
  assert.equal(shouldRevealStealthEnemy(fogGame, enemy), false);
});

test('rain joins the late-weather pool and hits optical platforms harder than missile batteries', () => {
  assert.equal(typeof getWeatherAccuracyMultiplier, 'function');

  const latePool = getWeatherPool(MODES.realistic, 7).map(weather => weather.id);
  const rain = {
    id: 'rain',
    effects: {
      accuracyMul: 0.94,
      turretAccMul: 0.9,
      fpvAccMul: 0.8,
      airfieldAccMul: 0.78,
    },
  };

  assert.ok(latePool.includes('rain'), `expected rain in late weather pool, got ${latePool.join(', ')}`);
  assert.ok(getWeatherAccuracyMultiplier(rain, 'crew') < getWeatherAccuracyMultiplier(rain, 'hawk'));
  assert.ok(getWeatherAccuracyMultiplier(rain, 'airfield') < getWeatherAccuracyMultiplier(rain, 'turret'));
});

test('storm slows shahed-class drones and gives them a real chance to fail the terminal strike', () => {
  assert.equal(typeof getWeatherEnemyMissChance, 'function');

  const storm = {
    id: 'storm',
    effects: {
      droneSpeedMul: 0.8,
      droneMissChance: 0.2,
    },
  };

  assert.equal(getWeatherEnemySpeedMultiplier(storm, 'kalibr'), 1);
  assert.ok(getWeatherEnemySpeedMultiplier(storm, 'shahed') < 1);
  assert.ok(getWeatherEnemySpeedMultiplier(storm, 'geran') < 1);
  assert.ok(getWeatherEnemyMissChance(storm, 'shahed') > 0);
  assert.equal(getWeatherEnemyMissChance(storm, 'kh101'), 0);
});

test('weather visual profiles stay atmospheric instead of flat overlays', () => {
  assert.equal(typeof getWeatherVisualProfile, 'function');

  const fog = getWeatherVisualProfile({ id: 'fog' });
  const rain = getWeatherVisualProfile({ id: 'rain' });
  const storm = getWeatherVisualProfile({ id: 'storm' });

  assert.ok(fog.fogLayers >= 3, `fog should feel layered, got ${fog.fogLayers}`);
  assert.ok(fog.edgeVignetteAlpha > 0.08, `fog should dim edges, got ${fog.edgeVignetteAlpha}`);
  assert.ok(rain.rainLayers >= 2, `rain should use more than one streak layer, got ${rain.rainLayers}`);
  assert.ok(rain.groundMistAlpha > 0.03, `rain should leave some cold mist near the ground, got ${rain.groundMistAlpha}`);
  assert.ok(storm.lightningAlpha > 0, `storm should be able to flash, got ${storm.lightningAlpha}`);
  assert.ok(storm.cloudVeilAlpha > rain.cloudVeilAlpha, `storm should feel heavier than rain: ${storm.cloudVeilAlpha} vs ${rain.cloudVeilAlpha}`);
});
