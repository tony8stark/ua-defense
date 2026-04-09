import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { GRID, CITIES } from '../src/data/cities.js';
import { setMuted } from '../src/audio/SoundManager.js';
import { getBattleCalloutText, getUpkeepQuip, getWaveFundingQuip } from '../src/data/battleQuips.js';
import { MODES } from '../src/data/difficulty.js';
import { updateIskander, updatePatriotAnim } from '../src/game/iskander.js';
import { getEnemySpawnProfile } from '../src/game/waves.js';
import {
  advanceEnemyNavigation,
  applyRetaliationTarget,
  createDeepIngressPlan,
  createGuidedWaypoints,
  getDeepIngressChance,
  getEnemyNavPoint,
  getIngressEdges,
  getRetaliationChance,
  shouldUseDeepIngress,
} from '../src/game/enemy-ai.js';
import { getWaveUpkeepCost } from '../src/game/economy.js';
import { recordTurretShot } from '../src/game/overheat.js';
import { canPlaceTowerAt } from '../src/game/placement.js';
import { getTargetDefenseChance, spawnEnemy } from '../src/game/spawner.js';
import { addLog, createGameState, updateBattleCallout } from '../src/game/state.js';

function createRoll(...values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

test('deep ingress pushes shaheds and cruise missiles deep into the map before terminal attack', () => {
  const city = CITIES.odesa;
  const target = { x: 180, y: 420 };
  const shahedPlan = createDeepIngressPlan(city, 'shahed', target, createRoll(0.4, 0.75, 0.2));
  const kalibrPlan = createDeepIngressPlan(city, 'kalibr', target, createRoll(0.9, 0.82, 0.65));

  assert.ok(shahedPlan.pivot.x < shahedPlan.spawn.x, `shahed should penetrate inland before turning: ${shahedPlan.pivot.x} vs ${shahedPlan.spawn.x}`);
  assert.ok(shahedPlan.pivot.x > target.x + GRID * 2, `shahed pivot should still be ahead of the target: ${shahedPlan.pivot.x} vs ${target.x}`);
  assert.deepEqual(getIngressEdges(city, 'kalibr'), ['top', 'right', 'bottom', 'left']);
  assert.equal(shouldUseDeepIngress('kalibr', 3, MODES.kobayashiMaru, 0.99), true);
  assert.ok(getDeepIngressChance('shahed', 15, MODES.kobayashiMaru) > getDeepIngressChance('shahed', 2, MODES.realistic));
  assert.ok(kalibrPlan.pivot.x >= GRID && kalibrPlan.pivot.x <= city.width - GRID);
  assert.ok(kalibrPlan.pivot.y >= GRID && kalibrPlan.pivot.y <= city.height - GRID);
});

test('retaliation targeting queues a tower strike until cruise ingress ends', () => {
  const enemy = {
    type: 'shahed',
    target: { mode: 'building', key: 'port' },
    deepIngress: { phase: 'cruise', pivot: { x: 300, y: 240 }, revealRadius: GRID },
    x: 300,
    y: 240,
  };

  assert.equal(applyRetaliationTarget(enemy, 7, 0), true);
  assert.deepEqual(enemy.pendingTarget, { mode: 'tower', id: 7 });
  assert.deepEqual(enemy.target, { mode: 'building', key: 'port' });

  advanceEnemyNavigation(enemy);

  assert.equal(enemy.deepIngress.phase, 'terminal');
  assert.deepEqual(enemy.target, { mode: 'tower', id: 7 });
  assert.equal(enemy.pendingTarget, null);
});

test('guided path uses finite waypoints and keeps a terminal lock instead of chaotic drift', () => {
  const city = CITIES.kyiv;
  const spawn = { x: city.width + 40, y: 120 };
  const target = { x: 260, y: 420 };
  const enemy = {
    type: 'guided',
    x: spawn.x,
    y: spawn.y,
    target: { mode: 'building', key: 'rada' },
    guidedPath: createGuidedWaypoints(city, spawn, target, createRoll(0.8, 0.35, 0.45, 0.55, 0.65)),
  };

  assert.equal(enemy.guidedPath.length, 2);
  assert.deepEqual(getEnemyNavPoint(enemy, target), enemy.guidedPath[0]);

  enemy.x = enemy.guidedPath[0].x;
  enemy.y = enemy.guidedPath[0].y;
  advanceEnemyNavigation(enemy);

  assert.equal(enemy.guidedPath.length, 1);
  assert.deepEqual(getEnemyNavPoint(enemy, target), enemy.guidedPath[0]);
  assert.deepEqual(enemy.target, { mode: 'building', key: 'rada' });
});

test('placement footprint blocks adjacent cells but keeps two-cell spacing open', () => {
  const g = createGameState(CITIES.odesa, MODES.kobayashiMaru);
  const anchor = { id: 1, type: 'turret', x: 210, y: 210, hp: 80, maxHp: 80 };
  g.towers.push(anchor);

  const adjacent = canPlaceTowerAt(g, 'turret', { x: anchor.x + GRID, y: anchor.y });
  const twoCellsAway = canPlaceTowerAt(g, 'turret', { x: anchor.x + GRID * 2, y: anchor.y });

  assert.equal(adjacent.ok, false);
  assert.equal(adjacent.reason, 'footprint');
  assert.equal(twoCellsAway.ok, true);
});

test('turret overheat enforces a longer recovery after repeated bursts', () => {
  const tower = { type: 'turret', burstShots: 0, overheatLock: 0 };
  const mode = { turret: { fireRate: 13, overheatShots: 3, overheatCooldown: 64 } };

  assert.deepEqual(recordTurretShot(tower, mode), { overheated: false, overheatLock: 0 });
  assert.deepEqual(recordTurretShot(tower, mode), { overheated: false, overheatLock: 0 });
  assert.deepEqual(recordTurretShot(tower, mode), { overheated: true, overheatLock: 64 });
  assert.equal(tower.burstShots, 0);
  assert.equal(tower.overheatLock, 64);
});

test('spawner gives missiles deep-ingress routes and guided drones finite waypoints', () => {
  const g = createGameState(CITIES.odesa, MODES.kobayashiMaru);

  spawnEnemy(g, 'kalibr');
  spawnEnemy(g, 'guided');

  const kalibr = g.enemies.find(enemy => enemy.type === 'kalibr');
  const guided = g.enemies.find(enemy => enemy.type === 'guided');

  assert.ok(kalibr?.deepIngress, 'kalibr should spawn with a deep-ingress route');
  assert.equal(kalibr?.deepIngress?.phase, 'cruise');
  assert.ok(guided?.guidedPath?.length >= 1, 'guided drones should spawn with a finite set of turn points');
});

test('app and combat wire placement footprints and turret overheat into the live game loop', () => {
  const appSource = readFileSync(resolve('src/App.jsx'), 'utf8');
  const combatSource = readFileSync(resolve('src/game/combat.js'), 'utf8');
  const engineSource = readFileSync(resolve('src/game/engine.js'), 'utf8');

  assert.match(appSource, /canPlaceTowerAt/, 'App should use the shared placement footprint helper');
  assert.match(appSource, /getPlacementPreview/, 'App hover should use the shared placement preview helper');
  assert.match(combatSource, /recordTurretShot/, 'combat should drive turret overheat from the shared helper');
  assert.doesNotMatch(combatSource, /synergyAcc/, 'combat should stop rewarding tower clumps with synergy accuracy');
  assert.match(engineSource, /advanceEnemyNavigation/, 'engine should advance ingress and guided navigation state');
  assert.doesNotMatch(engineSource, /g\.tick % 20 === 0/, 'guided drones should stop blindly retargeting every 20 ticks');
  assert.doesNotMatch(engineSource, /zigzag/, 'guided drones should stop using the old random zigzag drift');
});

test('engine applies upkeep pressure and mode-aware weather in late survival loops', () => {
  const engineSource = readFileSync(resolve('src/game/engine.js'), 'utf8');
  const eventsSource = readFileSync(resolve('src/game/events.js'), 'utf8');

  assert.match(engineSource, /getWaveUpkeepCost/, 'engine should charge upkeep for saturated defense packages between waves');
  assert.match(engineSource, /rollWeather\(g\.mode,\s*g\.wave\)/, 'engine should roll weather with difficulty and wave context');
  assert.match(engineSource, /getWaveFundingQuip\(\{[^}]*mode:\s*g\.mode/s, 'engine should pass difficulty into the post-wave funding quips');
  assert.match(engineSource, /getUpkeepQuip\(\{[^}]*mode:\s*g\.mode/s, 'engine should pass difficulty into upkeep quips');
  assert.match(eventsSource, /export function rollWeather\(mode,\s*waveIndex/, 'weather should scale with mode and wave index');
  assert.match(eventsSource, /storm/, 'late disruptive weather should include storm conditions');
});

test('funding quips mention a source and the credited amount', () => {
  const quip = getWaveFundingQuip({ amount: 28, wave: 7, net: 11, mode: MODES.realistic }, 0.45);

  assert.match(quip, /\+28💰/);
  assert.match(quip, /Міноборони|фонд|банка|донор|рахунок|закупівл/i);
});

test('upkeep quips keep the deduction visible and a bit sardonic', () => {
  const quip = getUpkeepQuip({ amount: 19, wave: 7, net: 5, mode: MODES.hell }, 0.65);

  assert.match(quip, /-19💰/);
  assert.match(quip, /утримання|бухгалтер|логіст|ремонт|обслуг|сервіс/i);
});

test('funding and upkeep quips shift tone between training and endless without losing humor', () => {
  const trainingFunding = getWaveFundingQuip({ amount: 18, wave: 2, net: 18, mode: MODES.training }, 0);
  const endlessFunding = getWaveFundingQuip({ amount: 18, wave: 14, net: -6, mode: MODES.kobayashiMaru }, 0);
  const endlessUpkeep = getUpkeepQuip({ amount: 33, wave: 14, net: -6, mode: MODES.kobayashiMaru }, 0);

  assert.notEqual(trainingFunding, endlessFunding);
  assert.match(trainingFunding, /\+18💰/);
  assert.match(endlessFunding, /\+18💰/);
  assert.match(endlessFunding, /ледве|ще дихає|останн|жив/i);
  assert.match(endlessUpkeep, /-33💰/);
  assert.match(endlessUpkeep, /фронт|зоопарк|героїзм|вижив/i);
});

test('battlefield callouts can echo key radio lines above the action and fade out cleanly', () => {
  const g = createGameState(CITIES.odesa, MODES.realistic);

  addLog(g, '📡 РЕБ! Зв\'язок під тиском!', {
    broadcast: { text: 'РЕБ ТИСНЕ ЕФІР', life: 3, priority: 2 },
  });

  assert.equal(g.battleCallout?.text, 'РЕБ ТИСНЕ ЕФІР');
  assert.equal(g.battleCallout?.priority, 2);

  updateBattleCallout(g);
  updateBattleCallout(g);
  updateBattleCallout(g);

  assert.equal(g.battleCallout, null);
});

test('patriot interception turns iskander resolution into a freeze-frame cinematic before the blast', () => {
  setMuted(true);
  const g = createGameState(CITIES.kyiv, MODES.realistic);

  g.wave = 6;
  g.waveActive = true;
  g.iskanderWarn = { x: 260, y: 180, life: 0 };
  g.mode = {
    ...g.mode,
    iskander: {
      ...g.mode.iskander,
      patriotChance: 1,
      warnTicks: 1,
    },
  };

  updateIskander(g);

  assert.equal(g.patriotAnim?.type, 'cinematicIntercept');
  assert.equal(g.patriotAnim?.freezeGameplay, true);
  assert.equal(g.iskanderWarn, null);
  assert.equal(g.explosions.length, 0);

  const frames = g.patriotAnim.totalTicks;
  for (let i = 0; i < frames; i++) updatePatriotAnim(g);

  assert.equal(g.patriotAnim, null);
  assert.ok(g.explosions.length > 0, 'cinematic intercept should bloom into an explosion after convergence');
});

test('battle callout helper shifts mood by difficulty while keeping the event readable', () => {
  const training = getBattleCalloutText('waveStart', MODES.training, 0);
  const endless = getBattleCalloutText('waveStart', MODES.kobayashiMaru, 0);
  const patriot = getBattleCalloutText('patriotHit', MODES.kobayashiMaru, 0.4);

  assert.notEqual(training, endless);
  assert.match(training, /повітряна|працюємо|спокійн/i);
  assert.match(endless, /знову|дихаємо|вижив|трима/i);
  assert.match(patriot, /перехоп|patriot|дих/i);
});

test('wave upkeep is currently disabled so post-wave cash is not shaved down', () => {
  const g = createGameState(CITIES.kyiv, MODES.kobayashiMaru);
  g.towers.push({
    id: 1,
    type: 'turret',
    hp: MODES.kobayashiMaru.turret.maxHp,
    maxHp: MODES.kobayashiMaru.turret.maxHp,
    cost: MODES.kobayashiMaru.turret.baseCost,
    level: 2,
  });

  assert.equal(getWaveUpkeepCost(g), 0);
  assert.equal(MODES.kobayashiMaru.upkeepMul, 0);
});

test('early kobayashi retaliation and tower damage leave fragile defenses alive after one shahed pass', () => {
  const earlyRetaliation = getRetaliationChance('shahed', MODES.kobayashiMaru, 0);
  const waveThreeRetaliation = getRetaliationChance('shahed', MODES.kobayashiMaru, 3);
  const lateRetaliation = getRetaliationChance('shahed', MODES.kobayashiMaru, 10);
  const earlyShahed = getEnemySpawnProfile(MODES.kobayashiMaru, 0, 'shahed', MODES.kobayashiMaru.shahed);
  const towerHit = Math.round(earlyShahed.dmg * MODES.kobayashiMaru.towerDamageMul);

  assert.ok(earlyRetaliation < lateRetaliation, `endless retaliation should ramp up over time: ${earlyRetaliation} vs ${lateRetaliation}`);
  assert.ok(earlyRetaliation <= 0.15, `opening retaliation should stay forgiving: ${earlyRetaliation}`);
  assert.ok(waveThreeRetaliation <= 0.25, `wave 3 retaliation should still be manageable on a thin budget: ${waveThreeRetaliation}`);
  assert.ok(towerHit < MODES.kobayashiMaru.mvg.maxHp, `early shahed tower strike should leave MVG alive: ${towerHit} vs ${MODES.kobayashiMaru.mvg.maxHp}`);
  assert.ok(towerHit < MODES.kobayashiMaru.crew.maxHp, `early shahed tower strike should leave crew alive: ${towerHit} vs ${MODES.kobayashiMaru.crew.maxHp}`);
});

test('realistic retaliation ramps in instead of opening at full tower-hunting aggression', () => {
  const openingShahed = getRetaliationChance('shahed', MODES.realistic, 0);
  const waveThreeShahed = getRetaliationChance('shahed', MODES.realistic, 2);
  const waveSixShahed = getRetaliationChance('shahed', MODES.realistic, 5);
  const lateShahed = getRetaliationChance('shahed', MODES.realistic, 8);
  const earlyLancet = getRetaliationChance('lancet', MODES.realistic, 2);

  assert.ok(openingShahed <= 0.1, `realistic should not start with full retaliation pressure: ${openingShahed}`);
  assert.ok(waveThreeShahed <= 0.25, `wave 3 retaliation should still be budget-manageable: ${waveThreeShahed}`);
  assert.ok(earlyLancet <= 0.24, `opening lancets should not instantly full-commit to tower deletion: ${earlyLancet}`);
  assert.ok(waveSixShahed < lateShahed, `retaliation should ramp over time: ${waveSixShahed} vs ${lateShahed}`);
  assert.ok(lateShahed >= 0.65, `late realistic should still regain sharp retaliation pressure: ${lateShahed}`);
});

test('realistic spawn targeting ramps tower pressure instead of opening with full tower focus', () => {
  const openingGeran = getTargetDefenseChance(MODES.realistic, 'geran', 0);
  const openingLancet = getTargetDefenseChance(MODES.realistic, 'lancet', 2);
  const openingGuided = getTargetDefenseChance(MODES.realistic, 'guided', 3);
  const lateLancet = getTargetDefenseChance(MODES.realistic, 'lancet', 6);
  const lateGuided = getTargetDefenseChance(MODES.realistic, 'guided', 6);

  assert.ok(openingGeran <= 0.12, `opening gerans should mostly stay on buildings: ${openingGeran}`);
  assert.ok(openingLancet <= 0.22, `first lancets should not open with near-half tower focus: ${openingLancet}`);
  assert.ok(openingGuided <= 0.6, `first guided drone should not almost hard-lock towers immediately: ${openingGuided}`);
  assert.ok(lateLancet >= 0.35, `later lancets should regain tower pressure: ${lateLancet}`);
  assert.ok(lateGuided >= 0.85, `later guided drones should return to their late-game threat: ${lateGuided}`);
});

test('kobayashi spawn targeting ramps from ten percent opener pressure to capped late-wave tower focus', () => {
  assert.equal(getTargetDefenseChance(MODES.kobayashiMaru, 'shahed', 0), 0.1);
  assert.equal(getTargetDefenseChance(MODES.kobayashiMaru, 'guided', 0), 0.1);
  assert.equal(getTargetDefenseChance(MODES.kobayashiMaru, 'guided', 18), 0.7);
  assert.equal(getTargetDefenseChance(MODES.kobayashiMaru, 'lancet', 18), 0.7);
  assert.equal(getTargetDefenseChance(MODES.realistic, 'shahed', 8), MODES.realistic.shahed.targetDef);
});
