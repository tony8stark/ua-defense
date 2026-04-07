import { DEF_META, getCost } from '../data/units.js';

export default function BottomBar({ mode, selected, onSelect, counts, waveActive, wave, onStartWave, spd, onToggleSpeed }) {
  const totalWaves = mode.waves.length;

  return (
    <div className="flex gap-1.5 mt-2 flex-wrap justify-center w-full">
      {['turret', 'crew', 'airfield'].map(key => {
        const d = mode[key];
        const meta = DEF_META[key];
        const c = counts[key] || 0;
        const cost = getCost(d.baseCost, mode.costEsc, c);
        const mx = c >= d.maxCount;

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="rounded-lg transition-all duration-150 min-w-[140px] py-1.5 px-2 text-[9px] font-bold"
            style={{
              background: selected === key ? `${meta.color}15` : '#0e1620',
              border: `2px solid ${selected === key ? meta.color : '#1a2535'}`,
              color: selected === key ? meta.color : '#556678',
              opacity: mx ? 0.5 : 1,
            }}
          >
            <div className="text-[11px]">{meta.emoji} {meta.name}</div>
            <div className="text-[8px] mt-0.5" style={{ color: '#3a4a5a' }}>
              💰{cost} ⚡{d.damage} 🎯{Math.round(d.hitChance * 100)}%
            </div>
            <div className="text-[8px] mt-px" style={{ color: mx ? '#ef4444' : '#2a3545' }}>
              {c}/{d.maxCount} {mx ? 'МАКС' : ''} {d.lossChance ? `📡${Math.round((1 - d.lossChance) * 100)}%` : ''}
            </div>
          </button>
        );
      })}

      <button
        onClick={onStartWave}
        disabled={waveActive || wave >= totalWaves}
        className="rounded-lg py-1.5 px-4 text-[11px] font-black uppercase tracking-wide"
        style={{
          background: waveActive ? '#0e1620' : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: waveActive ? '#3a4a5a' : '#fff',
          cursor: waveActive ? 'default' : 'pointer',
          boxShadow: waveActive ? 'none' : '0 0 20px rgba(239,68,68,0.2)',
        }}
      >
        {waveActive ? '⏳ Атака...' : wave >= totalWaves ? '✅' : '🚀 Хвиля!'}
      </button>

      <button
        onClick={onToggleSpeed}
        className="rounded-lg py-1.5 px-3 text-[11px] font-bold"
        style={{
          background: '#0e1620',
          color: spd > 1 ? '#f59e0b' : '#3a4a5a',
          border: `1px solid ${spd > 1 ? '#f59e0b33' : '#1a2535'}`,
        }}
      >
        ⏩ x{spd}
      </button>
    </div>
  );
}
