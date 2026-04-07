import { useState, useEffect, useRef, useCallback } from 'react';
import { CITIES, GRID } from './data/cities.js';
import { MODES } from './data/difficulty.js';
import { DEF_META, getCost } from './data/units.js';
import { uid, rnd } from './game/physics.js';
import { createGameState, getUIState } from './game/state.js';
import { update as gameUpdate, startWave as engineStartWave } from './game/engine.js';
import { draw } from './game/renderer/index.js';
import { screenToCanvas } from './hooks/useCanvasScale.js';
import MainMenu from './ui/MainMenu.jsx';
import DifficultySelect from './ui/DifficultySelect.jsx';
import ResultsScreen from './ui/ResultsScreen.jsx';
import GameHUD from './ui/GameHUD.jsx';
import BattleLog from './ui/BattleLog.jsx';
import BottomBar from './ui/BottomBar.jsx';

export default function App() {
  const [phase, setPhase] = useState('menu'); // menu | difficulty | playing | won | lost
  const [cityId, setCityId] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [selected, _setSelected] = useState('turret');
  const [spd, _setSpd] = useState(1);
  const [ui, setUI] = useState({ money: 0, score: 0, wave: 0, killed: 0, waveActive: false, bHp: {}, counts: {}, logs: [] });

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

  // Phase transitions
  const goMenu = useCallback(() => { phaseRef.current = 'menu'; setPhase('menu'); }, []);
  const selectCity = useCallback((id) => { setCityId(id); setPhase('difficulty'); }, []);
  const selectDifficulty = useCallback((d) => {
    setDifficulty(d);
    phaseRef.current = 'playing';
    setPhase('playing');
  }, []);

  // Start wave
  const startWave = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    engineStartWave(g);
    setUI(getUIState(g));
  }, []);

  // Place tower on click
  const handleClick = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;
    const city = g.city;
    const m = g.mode;
    const pos = screenToCanvas(e, canvasRef.current, city.width, city.height);
    const sel = selectedRef.current;
    const def = m[sel];
    const zone = city.placeZone;

    const existing = g.towers.filter(t => t.type === sel && t.hp > 0).length;
    if (existing >= def.maxCount) return;

    const cost = getCost(def.baseCost, m.costEsc, existing);
    if (g.money < cost) return;
    if (pos.x < zone.left || pos.x > zone.right) return;

    const gx = Math.floor(pos.x / GRID) * GRID + GRID / 2;
    const gy = Math.floor(pos.y / GRID) * GRID + GRID / 2;

    // Check collisions with existing towers
    for (const t of g.towers) {
      if (t.hp > 0 && Math.abs(t.x - gx) < GRID * 0.8 && Math.abs(t.y - gy) < GRID * 0.8) return;
    }
    // Check collisions with buildings
    for (const b of g.buildings) {
      if (Math.sqrt((gx - b.x) ** 2 + (gy - b.y) ** 2) < 45) return;
    }

    const tower = { x: gx, y: gy, type: sel, ...def, cost, cooldown: 0, angle: 0, id: uid(), hp: def.maxHp, maxHp: def.maxHp };
    g.towers.push(tower);

    if (sel === 'airfield') {
      g.kukurzniki.push({
        x: gx, y: gy, angle: 0, px: gx, py: gy,
        oa: rnd(0, Math.PI * 2), or: 90,
        range: def.range, damage: def.damage, fireRate: def.fireRate, hitChance: def.hitChance,
        cooldown: 0, id: uid(), color: '#f59e0b', towerId: tower.id,
      });
    }

    g.money -= cost;
    setUI(getUIState(g));
  }, []);

  // Hover for placement preview
  const handleMove = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const g = gRef.current;
    if (!g) return;
    const city = g.city;
    const zone = city.placeZone;
    const pos = screenToCanvas(e, canvasRef.current, city.width, city.height);
    hoverRef.current = (pos.x >= zone.left && pos.x <= zone.right)
      ? { x: Math.floor(pos.x / GRID) * GRID + GRID / 2, y: Math.floor(pos.y / GRID) * GRID + GRID / 2 }
      : null;
  }, []);

  // Touch support: treat touchstart as click
  const handleTouch = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      // Simulate mouse event for handleClick
      handleClick({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }, [handleClick]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing' || !cityId || !difficulty) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const city = CITIES[cityId];
    const mode = MODES[difficulty];

    // Apply city bonuses to mode
    const adjustedMode = { ...mode };
    if (city.bonuses?.turretAccuracy) {
      adjustedMode.turret = { ...mode.turret, hitChance: mode.turret.hitChance + city.bonuses.turretAccuracy };
    }

    gRef.current = createGameState(city, adjustedMode);
    setUI(getUIState(gRef.current));
    setSelected('turret');
    setSpd(1);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let syncCounter = 0;

    function loop() {
      if (phaseRef.current !== 'playing') return;
      const g = gRef.current;
      if (!g) return;

      for (let step = 0; step < spdRef.current; step++) {
        const result = gameUpdate(g);
        if (result === 'won') { phaseRef.current = 'won'; setPhase('won'); setUI(getUIState(g)); return; }
        if (result === 'lost') { phaseRef.current = 'lost'; setPhase('lost'); setUI(getUIState(g)); return; }
      }

      draw(ctx, g, hoverRef.current, selectedRef.current);

      // Sync React state at ~10fps instead of every frame
      syncCounter++;
      if (syncCounter % 6 === 0) {
        setUI(getUIState(g));
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, cityId, difficulty]);

  // MENU
  if (phase === 'menu') {
    return <MainMenu onSelectCity={selectCity} />;
  }

  // DIFFICULTY SELECT
  if (phase === 'difficulty') {
    return <DifficultySelect cityId={cityId} onSelect={selectDifficulty} onBack={goMenu} />;
  }

  // RESULTS
  if (phase === 'won' || phase === 'lost') {
    return <ResultsScreen phase={phase} killed={ui.killed} score={ui.score} wave={ui.wave} difficulty={difficulty} bHp={ui.bHp} onMenu={goMenu} />;
  }

  // PLAYING
  const city = CITIES[cityId];
  const mode = MODES[difficulty];
  if (!city || !mode) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center p-1.5 sm:p-2" style={{ background: '#080e16' }}>
      <div className="w-full" style={{ maxWidth: 1060 }}>
        <GameHUD
          money={ui.money} killed={ui.killed} score={ui.score}
          wave={ui.wave} waveActive={ui.waveActive} totalWaves={mode.waves.length}
          difficulty={difficulty} buildings={city.buildings} bHp={ui.bHp}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 6, width: '100%', maxWidth: 1060 }}>
        <div ref={containerRef} style={{ flex: '1 1 0%', minWidth: 0, maxWidth: 880 }}>
          <canvas
            ref={canvasRef}
            width={city.width}
            height={city.height}
            onClick={handleClick}
            onMouseMove={handleMove}
            onMouseLeave={() => { hoverRef.current = null; }}
            onTouchStart={handleTouch}
            className="rounded-lg"
            style={{
              border: '1px solid #1e293b',
              cursor: 'crosshair',
              background: '#0c1222',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)',
              maxHeight: 'calc(100dvh - 130px)',
              width: '100%',
              display: 'block',
            }}
          />
        </div>
        <BattleLog logs={ui.logs} />
      </div>

      <div className="w-full" style={{ maxWidth: 1060 }}>
        <BottomBar
          mode={mode} selected={selected} onSelect={setSelected}
          counts={ui.counts} waveActive={ui.waveActive} wave={ui.wave}
          onStartWave={startWave} spd={spd}
          onToggleSpeed={() => setSpd(spd >= 3 ? 1 : spd + 1)}
        />
      </div>

      {/* Mobile battle log - shown below controls on small screens */}
      <div className="md:hidden mt-1.5 w-full" style={{ maxWidth: city.width }}>
        <div className="flex gap-1 overflow-x-auto text-[9px] py-1 px-1" style={{ color: '#94a3b8' }}>
          {ui.logs.slice(0, 3).map((l, i) => (
            <span key={l.t + '' + i} className="whitespace-nowrap">{l.msg}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
