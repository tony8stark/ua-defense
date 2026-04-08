import { DEF_META, getCost } from '../data/units.js';

const UNIT_ORDER = ['turret', 'mvg', 'crew', 'airfield', 'hawk', 'gepard', 'irist', 'decoy'];

export default function BottomBar({ mode, selected, onSelect, counts, waveActive, wave, onStartWave, spd, onToggleSpeed, trivogaActive, trivogaCooldown, onTrivoga }) {
  const totalWaves = mode.waves.length;

  return (
    <div style={{ marginTop: 4, marginBottom: 2, width: '100%' }}>
      {/* Unit selection row - horizontally scrollable */}
      <div className="scroll-thin" style={{ display: 'flex', gap: 4, width: '100%', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {UNIT_ORDER.map(key => {
          const d = mode[key];
          if (!d) return null; // guard: unit type not in this difficulty
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
                background: active ? `${meta.color}18` : '#0e1620',
                border: `2px solid ${active ? meta.color : '#1e293b'}`,
                color: active ? meta.color : '#94a3b8',
                opacity: mx ? 0.45 : 1,
                borderRadius: 8,
                padding: '6px 4px',
                textAlign: 'center',
                flex: '1 1 0%',
                minWidth: 72,
                minHeight: 44,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{meta.emoji} {meta.name}</div>
              <div className="font-mono" style={{ fontSize: 11, marginTop: 2, color: active ? meta.color + 'bb' : '#64748b' }}>
                💰{cost} {d.damage ? (d.damage >= 999 ? '⚡💀' : `⚡${d.damage}`) : ''} {d.hitChance ? `${Math.round(d.hitChance * 100)}%` : ''}
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: mx ? '#ef4444' : '#475569' }}>
                {c}/{d.maxCount}{mx ? ' МАКС' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button
          onClick={onStartWave}
          disabled={waveActive || wave >= totalWaves}
          style={{
            background: waveActive ? '#0e1620' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: waveActive ? '#64748b' : '#fff',
            cursor: waveActive ? 'default' : 'pointer',
            boxShadow: waveActive ? 'none' : '0 0 16px rgba(239,68,68,0.25)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 16,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 1,
            flex: '1 1 0%',
            minHeight: 44,
          }}
        >
          {waveActive ? '⏳ Атака...' : wave >= totalWaves ? '✅ Перемога' : '🚀 Хвиля!'}
        </button>

        {/* Тривога! active ability */}
        {(() => {
          const canUse = waveActive && !trivogaActive && trivogaCooldown <= 0;
          const cdPct = trivogaCooldown > 0 ? Math.round(trivogaCooldown / 810 * 100) : 0;
          return (
            <button
              onClick={onTrivoga}
              disabled={!canUse}
              style={{
                background: trivogaActive ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : (canUse ? '#7f1d1d' : '#0e1620'),
                color: trivogaActive ? '#000' : (canUse ? '#fbbf24' : '#475569'),
                border: `2px solid ${trivogaActive ? '#fbbf24' : (canUse ? '#f59e0b44' : '#1e293b')}`,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                fontWeight: 900,
                flexShrink: 0,
                minHeight: 44,
                minWidth: 70,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {trivogaActive ? '🚨 АКТ!' : trivogaCooldown > 0 ? `⏳ ${cdPct}%` : '🚨'}
              {!trivogaActive && <div style={{ fontSize: 9, marginTop: 1 }}>{trivogaCooldown > 0 ? '' : 'Тривога'}</div>}
            </button>
          );
        })()}

        <button
          onClick={onToggleSpeed}
          style={{
            background: spd > 1 ? '#f59e0b18' : '#0e1620',
            color: spd > 1 ? '#fbbf24' : '#64748b',
            border: `2px solid ${spd > 1 ? '#f59e0b44' : '#1e293b'}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
            minHeight: 44,
            minWidth: 64,
          }}
        >
          ⏩x{spd}
        </button>
      </div>
    </div>
  );
}
