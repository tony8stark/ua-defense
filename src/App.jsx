import { useState, useEffect, useRef, useCallback } from 'react';
import { GRID, getCityConfig } from './data/cities.js';
import { MODES } from './data/difficulty.js';
import { DEF_META, getCost, UPGRADES, getUpgradeCost, getSellPrice, getRepairCost } from './data/units.js';
import { uid, rnd, dist } from './game/physics.js';
import {
  createGameState,
  getUIState,
  addLog,
  registerUnit,
  markUnitSold,
  getFinalRoster,
  getBalanceTelemetry,
  trackUnitSpend,
  trackUnitRefund,
  trackRepairSpend,
  activateTrivoga,
  getBuildingBonuses,
} from './game/state.js';
import { getIskanderQuip } from './data/battleQuips.js';
import { playSiren } from './audio/SoundManager.js';
import { getCallsign } from './data/callsigns.js';
import { playPlace, playSell, playGameOver, playWaveComplete, resumeOnInteraction } from './audio/SoundManager.js';
import { update as gameUpdate, startWave as engineStartWave } from './game/engine.js';
import { createTouchPressState, finishTouchPress } from './game/touch.js';
import { getWaveDisplayTotal } from './game/waves.js';
import { draw } from './game/renderer/index.js';
import { screenToCanvas } from './hooks/useCanvasScale.js';
import MainMenu from './ui/MainMenu.jsx';
import DifficultySelect from './ui/DifficultySelect.jsx';
import ResultsScreen from './ui/ResultsScreen.jsx';
import GameHUD from './ui/GameHUD.jsx';
import BattleLog from './ui/BattleLog.jsx';
import BottomBar from './ui/BottomBar.jsx';
import ContextMenu from './ui/ContextMenu.jsx';
import Leaderboard from './ui/Leaderboard.jsx';
import TechPage from './ui/TechPage.jsx';
import Tutorial from './ui/Tutorial.jsx';
import { shouldShowTutorial } from './ui/tutorialStorage.js';

export default function App() {
  const [phase, setPhase] = useState('menu');
  const [cityId, setCityId] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [selected, _setSelected] = useState('turret');
  const [spd, _setSpd] = useState(1);
  const [ui, setUI] = useState({ money: 0, score: 0, wave: 0, killed: 0, waveActive: false, bHp: {}, counts: {}, logs: [] });
  const [ctxMenu, setCtxMenu] = useState(null); // { type: 'tower'|'building', item, screenX, screenY }
  const [showTutorial, setShowTutorial] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gRef = useRef(null);
  const animRef = useRef(null);
  const hoverRef = useRef(null);
  const selectedRef = useRef('turret');
  const spdRef = useRef(1);
  const phaseRef = useRef('menu');

  const setSelected = (v) => { selectedRef.current = v; _setSelected(v); };
  const setSpd = (v) => { spdRef.current = v; _setSpd(v); };
  const syncUI = () => { const g = gRef.current; if (g) setUI(getUIState(g)); };

  // Phase transitions
  const goMenu = useCallback(() => { phaseRef.current = 'menu'; setPhase('menu'); setCtxMenu(null); }, []);
  const selectCity = useCallback((id) => { setCityId(id); setPhase('difficulty'); }, []);
  const selectDifficulty = useCallback((d) => {
    setDifficulty(d);
    phaseRef.current = 'playing';
    setPhase('playing');
    if (shouldShowTutorial()) setShowTutorial(true);
  }, []);

  // Start wave
  const startWave = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    engineStartWave(g);
    setCtxMenu(null);
    syncUI();
  }, []);

  // Find tower or building at canvas position
  function findTargetAt(g, pos) {
    // Check towers first
    for (const t of g.towers) {
      if (t.hp > 0 && dist(t, pos) < 20) {
        return { type: 'tower', item: { ...t, _mode: g.mode } };
      }
    }
    // Check buildings
    for (const b of g.buildings) {
      if (dist(b, pos) < 30) {
        return { type: 'building', item: b };
      }
    }
    return null;
  }

  // Left click: place tower OR open context menu on existing tower/building
  const handleClick = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;

    // Close context menu if open
    if (ctxMenu) { setCtxMenu(null); return; }

    const city = g.city;
    const m = g.mode;
    const pos = screenToCanvas(e, canvasRef.current, city.width, city.height);
    const zone = city.placeZone;

    // Check if clicking on existing tower or building
    const target = findTargetAt(g, pos);
    if (target) {
      setCtxMenu({ ...target, screenX: e.clientX, screenY: e.clientY });
      return;
    }

    // Place new tower
    const sel = selectedRef.current;
    const def = m[sel];
    const existing = g.towers.filter(t => t.type === sel && t.hp > 0).length;
    if (existing >= def.maxCount) return;

    const cost = getCost(def.baseCost, m.costEsc, existing);
    if (g.money < cost) return;
    if (pos.x < zone.left || pos.x > zone.right) return;
    if (zone.top && pos.y < zone.top) return;
    if (zone.bottom && pos.y > zone.bottom) return;

    const gx = Math.floor(pos.x / GRID) * GRID + GRID / 2;
    const gy = Math.floor(pos.y / GRID) * GRID + GRID / 2;

    for (const t of g.towers) {
      if (t.hp > 0 && Math.abs(t.x - gx) < GRID * 0.8 && Math.abs(t.y - gy) < GRID * 0.8) return;
    }
    for (const b of g.buildings) {
      if (Math.sqrt((gx - b.x) ** 2 + (gy - b.y) ** 2) < 35) return;
    }

    const tower = { x: gx, y: gy, type: sel, ...def, cost, cooldown: 0, angle: 0, id: uid(), hp: def.maxHp, maxHp: def.maxHp, level: 0, callsign: getCallsign(), kills: 0 };

    // MVG: store patrol origin and random angle
    if (sel === 'mvg') {
      tower.originX = gx;
      tower.originY = gy;
      tower.patrolAngle = Math.random() * Math.PI;
      tower.patrolSeed = Math.random() * Math.PI * 2;
      tower.patrolRange = def.patrolRange || 56;
    }

    g.towers.push(tower);
    registerUnit(g, tower);
    trackUnitSpend(g, sel, cost, 'purchase');

    if (sel === 'airfield') {
      g.kukurzniki.push({
        x: gx, y: gy, angle: 0, px: gx, py: gy,
        oa: rnd(0, Math.PI * 2), or: 90,
        range: def.range, damage: def.damage, fireRate: def.fireRate, hitChance: def.hitChance,
        cooldown: 0, id: uid(), color: '#f59e0b', towerId: tower.id,
      });
    }

    g.money -= cost;
    playPlace();
    syncUI();
  }, [ctxMenu]);

  // Right click: context menu
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;
    const pos = screenToCanvas(e, canvasRef.current, g.city.width, g.city.height);
    const target = findTargetAt(g, pos);
    if (target) {
      setCtxMenu({ ...target, screenX: e.clientX, screenY: e.clientY });
    } else {
      setCtxMenu(null);
    }
  }, []);

  // Hover
  const handleMove = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;
    const zone = g.city.placeZone;
    const pos = screenToCanvas(e, canvasRef.current, g.city.width, g.city.height);
    const inZone = pos.x >= zone.left && pos.x <= zone.right
      && (!zone.top || pos.y >= zone.top) && (!zone.bottom || pos.y <= zone.bottom);
    hoverRef.current = inZone
      ? { x: Math.floor(pos.x / GRID) * GRID + GRID / 2, y: Math.floor(pos.y / GRID) * GRID + GRID / 2 }
      : null;
  }, []);

  // Touch: tap to place/select, long-press for context menu
  const touchTimer = useRef(null);
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const evt = { clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} };

    touchTimer.current = createTouchPressState(evt, {
      delayMs: 300,
      onLongPress(nextEvt) {
        touchTimer.current = null;
        handleRightClick({ ...nextEvt, preventDefault: () => {} });
      },
    });
  }, [handleRightClick]);

  const handleTouchEnd = useCallback(() => {
    const state = touchTimer.current;
    if (!state) return;
    touchTimer.current = null;
    finishTouchPress(state, { onTap: handleClick });
  }, [handleClick]);

  // === M3 ACTIONS ===

  // Sell tower
  const handleSell = useCallback((tower) => {
    const g = gRef.current;
    if (!g) return;
    const t = g.towers.find(tw => tw.id === tower.id);
    if (!t || t.hp <= 0) return;
    const price = getSellPrice(t);
    t.hp = 0;
    markUnitSold(g, t.id);
    trackUnitRefund(g, t.type, price);
    if (t.type === 'airfield') {
      g.kukurzniki = g.kukurzniki.filter(k => k.towerId !== t.id);
    }
    g.money += price;
    addLog(g, `💰 ${DEF_META[t.type].name} продано (+${price})`);
    playSell();
    setCtxMenu(null);
    syncUI();
  }, []);

  // Upgrade tower
  const handleUpgrade = useCallback((tower) => {
    const g = gRef.current;
    if (!g || g.waveActive) return;
    const t = g.towers.find(tw => tw.id === tower.id);
    if (!t || t.hp <= 0) return;
    const level = t.level || 0;
    const nextLevel = level + 1;
    const upgrade = UPGRADES[t.type]?.[nextLevel];
    if (!upgrade) return;
    const cost = getUpgradeCost(t, g.mode);
    if (g.money < cost) return;

    // Apply stat multipliers
    for (const [stat, mul] of Object.entries(upgrade.stats)) {
      if (stat === 'lossChance') {
        // lossChance is on the mode, not the tower; store override on tower
        t.lossChanceOverride = (t.lossChanceOverride || g.mode.crew.lossChance) * mul;
      } else if (stat === 'fireRate') {
        t[stat] = Math.round(t[stat] * mul); // lower = faster
      } else {
        t[stat] = Math.round(t[stat] * mul * 100) / 100;
      }
    }
    t.level = nextLevel;
    t.hp = Math.min(t.hp + 20, t.maxHp); // small heal on upgrade
    g.money -= cost;
    trackUnitSpend(g, t.type, cost, 'upgrade');

    // Update kukurznik stats if airfield
    if (t.type === 'airfield') {
      const k = g.kukurzniki.find(ku => ku.towerId === t.id);
      if (k) {
        if (upgrade.stats.range) k.range = Math.round(k.range * upgrade.stats.range * 100) / 100;
        if (upgrade.stats.damage) k.damage = Math.round(k.damage * upgrade.stats.damage * 100) / 100;
        if (upgrade.stats.hitChance) k.hitChance = Math.round(k.hitChance * upgrade.stats.hitChance * 100) / 100;
      }
    }

    addLog(g, `⬆ ${DEF_META[t.type].name} → ${upgrade.label}`);
    setCtxMenu(null);
    syncUI();
  }, []);

  // Repair building
  const handleRepair = useCallback((building) => {
    const g = gRef.current;
    if (!g || g.waveActive) return;
    const b = g.buildings.find(bl => bl.key === building.key);
    if (!b || b.hp <= 0 || b.hp >= b.maxHp) return;
    const bb = getBuildingBonuses(g);
    const cost = getRepairCost(b, bb);
    if (g.money < cost) return;

    b.hp = b.maxHp;
    g.money -= cost;
    trackRepairSpend(g, b.key, cost);
    addLog(g, `🔧 ${b.name} відремонтовано (-${cost}💰)`);
    setCtxMenu(null);
    syncUI();
  }, []);

  // Тривога! active ability
  const handleTrivoga = useCallback(() => {
    const g = gRef.current;
    if (!g || !g.waveActive) return;
    if (activateTrivoga(g)) {
      playSiren();
      syncUI();
    }
  }, []);

  // Iskander scramble: click warning zone to move nearby towers away
  const handleIskanderScramble = useCallback((pos) => {
    const g = gRef.current;
    if (!g || !g.iskanderWarn) return;
    const iw = g.iskanderWarn;
    if (iw.scrambled) return;
    if (dist(pos, { x: iw.x, y: iw.y }) > GRID * 2) return; // must click near warning

    const SAFE_RADIUS = GRID * 1.95;
    let moved = 0;
    for (const t of g.towers) {
      if (t.hp <= 0) continue;
      const currentDist = dist(t, { x: iw.x, y: iw.y });
      if (currentDist < GRID * 1.8) {
        let dx = t.x - iw.x;
        let dy = t.y - iw.y;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          dx = t.x >= g.city.width / 2 ? 1 : -1;
          dy = t.y >= g.city.height / 2 ? 1 : -1;
        }
        const baseDist = Math.sqrt(dx * dx + dy * dy) || 1;
        const moveDist = Math.max(GRID, SAFE_RADIUS - currentDist);
        const newX = t.x + (dx / baseDist) * moveDist;
        const newY = t.y + (dy / baseDist) * moveDist;

        t.x = Math.max(GRID / 2, Math.min(g.city.width - GRID / 2, newX));
        t.y = Math.max(GRID / 2, Math.min(g.city.height - GRID / 2, newY));
        if (t.type === 'mvg') {
          t.originX = t.x;
          t.originY = t.y;
        }
        // Move kukurznik orbit center too
        if (t.type === 'airfield') {
          const k = g.kukurzniki.find(ku => ku.towerId === t.id);
          if (k) { k.px = t.x; k.py = t.y; }
        }
        moved++;
      }
    }
    if (moved > 0) {
      iw.scrambled = true;
      addLog(g, `🏃 ${getIskanderQuip('scramble')}`);
      syncUI();
    }
  }, []);

  // Enhanced click handler that also checks for Iskander scramble
  const handleCanvasClick = useCallback((e) => {
    resumeOnInteraction();
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;
    const pos = screenToCanvas(e, canvasRef.current, g.city.width, g.city.height);

    // Check if clicking Iskander warning zone
    if (g.iskanderWarn && dist(pos, { x: g.iskanderWarn.x, y: g.iskanderWarn.y }) < GRID * 2) {
      handleIskanderScramble(pos);
      return;
    }

    handleClick(e);
  }, [handleClick, handleIskanderScramble]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing' || !cityId || !difficulty) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const city = getCityConfig(cityId);
    const mode = MODES[difficulty];

    const adjustedMode = { ...mode };
    if (city.bonuses?.turretAccuracy) {
      adjustedMode.turret = { ...mode.turret, hitChance: mode.turret.hitChance + city.bonuses.turretAccuracy };
    }

    gRef.current = createGameState(city, adjustedMode);
    syncUI();
    setSelected('turret');
    setSpd(1);
    setCtxMenu(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let syncCounter = 0;

    function loop() {
      if (phaseRef.current !== 'playing') return;
      const g = gRef.current;
      if (!g) return;

      for (let step = 0; step < spdRef.current; step++) {
        const result = gameUpdate(g);
        if (result === 'won') { phaseRef.current = 'won'; setPhase('won'); setUI(getUIState(g)); playWaveComplete(); return; }
        if (result === 'lost') { phaseRef.current = 'lost'; setPhase('lost'); setUI(getUIState(g)); playGameOver(); return; }
      }

      draw(ctx, g, hoverRef.current, selectedRef.current);

      syncCounter++;
      if (syncCounter % 6 === 0) setUI(getUIState(g));

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, cityId, difficulty]);

  // MENU
  if (phase === 'menu') return <MainMenu onSelectCity={selectCity} onShowLeaderboard={() => setPhase('leaderboard')} onShowTech={() => setPhase('tech')} />;
  if (phase === 'leaderboard') return <Leaderboard onBack={goMenu} />;
  if (phase === 'tech') return <TechPage onBack={goMenu} />;
  if (phase === 'difficulty') return <DifficultySelect cityId={cityId} onSelect={selectDifficulty} onBack={goMenu} />;
  if (phase === 'won' || phase === 'lost') {
    const roster = gRef.current ? getFinalRoster(gRef.current) : [];
    const telemetry = gRef.current ? getBalanceTelemetry(gRef.current) : null;
    return <ResultsScreen phase={phase} killed={ui.killed} score={ui.score} wave={ui.wave} difficulty={difficulty} bHp={ui.bHp} cityId={cityId} roster={roster} totalSpawned={ui.totalSpawned} spawnedByType={ui.spawnedByType} killedByType={ui.killedByType} patriotInterceptions={ui.patriotInterceptions} bestCombo={ui.bestCombo} telemetry={telemetry} onMenu={goMenu} onLeaderboard={() => { phaseRef.current = 'leaderboard'; setPhase('leaderboard'); }} />;
  }

  // PLAYING
  const city = getCityConfig(cityId);
  const mode = MODES[difficulty];
  const totalWaveLabel = getWaveDisplayTotal(mode);
  const repairDiscount = gRef.current ? getBuildingBonuses(gRef.current).repairDiscount : 0;
  if (!city || !mode) return null;

  return (
    <div style={{
      background: '#080e16', padding: '3px 3px env(safe-area-inset-bottom, 4px)',
      height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* HUD */}
      <div style={{ width: '100%', flexShrink: 0 }}>
        <GameHUD
          money={ui.money} killed={ui.killed} score={ui.score}
          wave={ui.wave} waveActive={ui.waveActive} totalWaves={totalWaveLabel}
          difficulty={difficulty} buildings={city.buildings} bHp={ui.bHp}
          weather={ui.weather} ewActive={ui.ewActive}
        />
      </div>

      {/* Canvas + sidebar: constrained to available space */}
      <div style={{ display: 'flex', gap: 6, marginTop: 3, width: '100%', maxWidth: 1200, flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ flex: '1 1 0%', minWidth: 0 }}>
          <canvas
            ref={canvasRef}
            width={city.width}
            height={city.height}
            onClick={handleCanvasClick}
            onContextMenu={handleRightClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { hoverRef.current = null; }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => { touchTimer.current = null; }}
            className="rounded-lg"
            style={{
              border: '1px solid #1e293b',
              cursor: 'crosshair',
              background: '#0c1222',
              display: 'block',
              width: '100%',
              maxHeight: '100%',
            }}
          />
        </div>
        {/* Sidebar log: desktop only, stretches to canvas height */}
        <div className="hidden lg:flex" style={{ flexShrink: 0, maxHeight: '100%' }}>
          <BattleLog logs={ui.logs} towers={ui.towers} />
        </div>
      </div>

      {/* Mobile log ticker */}
      <div className="lg:hidden" style={{ width: '100%', flexShrink: 0, marginTop: 2 }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 4px',
          fontSize: 11, whiteSpace: 'nowrap', scrollbarWidth: 'none',
        }}>
          {ui.logs.slice(0, 3).map((l, i) => (
            <span key={l.t + '' + i} style={{
              opacity: 1 - i * 0.25,
              color: l.msg.includes('ІСКАНДЕР') ? '#ef4444' : l.msg.includes('відбито') ? '#4ade80' : '#94a3b8',
            }}>{l.msg}</span>
          ))}
          {ui.logs.length === 0 && <span style={{ color: '#475569' }}>Очікування...</span>}
        </div>
      </div>

      {/* Controls - capped to reasonable width */}
      <div style={{ width: '100%', maxWidth: 1200, flexShrink: 0 }}>
        <BottomBar
          mode={mode} selected={selected} onSelect={setSelected}
          counts={ui.counts} waveActive={ui.waveActive} wave={ui.wave}
          onStartWave={startWave} spd={spd}
          onToggleSpeed={() => setSpd(spd >= 3 ? 1 : spd + 1)}
          trivogaActive={ui.trivogaActive} trivogaCooldown={ui.trivogaCooldown}
          onTrivoga={handleTrivoga}
        />
      </div>

      {/* Tutorial overlay */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Context menu */}
      <ContextMenu
        target={ctxMenu}
        money={ui.money}
        waveActive={ui.waveActive}
        repairDiscount={repairDiscount}
        onSell={handleSell}
        onUpgrade={handleUpgrade}
        onRepair={handleRepair}
        onClose={() => setCtxMenu(null)}
      />
    </div>
  );
}
