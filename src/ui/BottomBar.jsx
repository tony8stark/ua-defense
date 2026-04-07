import { DEF_META, getCost } from '../data/units.js';

export default function BottomBar({ mode, selected, onSelect, counts, waveActive, wave, onStartWave, spd, onToggleSpeed }) {
  const totalWaves = mode.waves.length;

  return (
    <div style={{ marginTop: 4, marginBottom: 2, width: '100%' }}>
      {/* Unit selection row */}
      <div style={{ display: 'flex', gap: 3, width: '100%' }}>
        {['turret', 'crew', 'airfield', 'decoy'].map(key => {
          const d = mode[key];
          const meta = DEF_META[key];
          const c = counts[key] || 0;
          const cost = getCost(d.baseCost, mode.costEsc, c);
          const mx = c >= d.maxCount;
          const active = selected === key;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: active ? `${meta.color}15` : '#0e1620',
                border: `2px solid ${active ? meta.color : '#1a2535'}`,
                color: active ? meta.color : '#556678',
                opacity: mx ? 0.5 : 1,
                borderRadius: 6,
                padding: '5px 3px',
                textAlign: 'center',
                flex: '1 1 0%',
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{meta.emoji} {meta.name}</div>
              <div style={{ fontSize: 8, marginTop: 1, color: '#3a4a5a' }}>
                💰{cost} {d.damage ? `⚡${d.damage}` : ''} {d.hitChance ? `${Math.round(d.hitChance * 100)}%` : ''}
              </div>
              <div style={{ fontSize: 8, color: mx ? '#ef4444' : '#2a3545' }}>
                {c}/{d.maxCount}{mx ? ' МАКС' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
        <button
          onClick={onStartWave}
          disabled={waveActive || wave >= totalWaves}
          style={{
            background: waveActive ? '#0e1620' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: waveActive ? '#3a4a5a' : '#fff',
            cursor: waveActive ? 'default' : 'pointer',
            boxShadow: waveActive ? 'none' : '0 0 20px rgba(239,68,68,0.2)',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 14,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 1,
            flex: '1 1 0%',
            maxWidth: 400,
          }}
        >
          {waveActive ? '⏳ Атака...' : wave >= totalWaves ? '✅ Перемога' : '🚀 Хвиля!'}
        </button>

        <button
          onClick={onToggleSpeed}
          style={{
            background: '#0e1620',
            color: spd > 1 ? '#f59e0b' : '#3a4a5a',
            border: `1px solid ${spd > 1 ? '#f59e0b33' : '#1a2535'}`,
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ⏩x{spd}
        </button>
      </div>
    </div>
  );
}
