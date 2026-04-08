import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../lib/supabase.js';
import { CITIES } from '../data/cities.js';
import { MODES } from '../data/difficulty.js';

export default function Leaderboard({ onBack, highlightName, highlightCity, highlightDifficulty }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState(highlightCity || '');
  const [filterDiff, setFilterDiff] = useState(highlightDifficulty || '');

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(filterCity || null, filterDiff || null)
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterCity, filterDiff]);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)',
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24', marginBottom: 20 }}>
        🏆 Таблиця рекордів
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="">Всі міста</option>
          {Object.values(CITIES).map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} style={selectStyle}>
          <option value="">Всі складності</option>
          {Object.entries(MODES).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 40, fontSize: 14 }}>Завантаження...</div>
        ) : entries.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 40, fontSize: 14 }}>Поки пусто. Будь першим!</div>
        ) : (
          entries.map((e, i) => {
            const isMe = highlightName && e.name === highlightName && e.city === highlightCity && e.difficulty === highlightDifficulty;
            const isTop3 = i < 3;
            const fontSize = i === 0 ? 20 : i === 1 ? 16 : i === 2 ? 14 : 13;
            const rankColor = i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#475569';
            const cityObj = CITIES[e.city];
            const modeObj = MODES[e.difficulty];

            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isTop3 ? '12px 14px' : '8px 14px',
                borderRadius: 8, marginBottom: 4,
                background: isMe ? '#4ade8012' : (i % 2 === 0 ? '#0f172a' : 'transparent'),
                border: isMe ? '1px solid #4ade8033' : '1px solid transparent',
              }}>
                <span style={{
                  width: 36, textAlign: 'right', fontWeight: 900,
                  fontSize: isTop3 ? fontSize + 2 : 13,
                  color: rankColor, flexShrink: 0,
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize, fontWeight: isTop3 ? 800 : 600,
                    color: isMe ? '#4ade80' : '#e2e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                    {cityObj?.emoji} {cityObj?.name} · {modeObj?.label} · {e.device === 'mobile' ? '📱' : '💻'}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-mono" style={{
                    fontSize: isTop3 ? fontSize : 14,
                    fontWeight: 900, color: '#fbbf24',
                  }}>
                    {e.score}
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: '#64748b' }}>
                    💀{e.kills} 🌊{e.waves_survived}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginTop: 24, padding: '12px 28px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
            minHeight: 44,
          }}
        >
          ← Назад
        </button>
      )}
    </div>
  );
}

const selectStyle = {
  background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
  borderRadius: 8, padding: '10px 14px', fontSize: 14,
  fontFamily: 'inherit', minHeight: 44,
};
