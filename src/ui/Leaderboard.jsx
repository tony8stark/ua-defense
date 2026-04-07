import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../lib/supabase.js';
import { CITIES } from '../data/cities.js';
import { MODES } from '../data/difficulty.js';

export default function Leaderboard({ currentCity, currentDifficulty, currentScore }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState(currentCity || '');
  const [filterDiff, setFilterDiff] = useState(currentDifficulty || '');

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(filterCity || null, filterDiff || null)
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterCity, filterDiff]);

  return (
    <div style={{
      background: '#0c1222', border: '1px solid #1e293b', borderRadius: 8,
      padding: '12px 14px', marginTop: 12, maxWidth: 420, width: '100%',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Таблиця рекордів
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '3px 6px', fontSize: 10 }}
        >
          <option value="">Всі міста</option>
          {Object.values(CITIES).map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
        <select
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '3px 6px', fontSize: 10 }}
        >
          <option value="">Всі складності</option>
          {Object.entries(MODES).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#475569', fontSize: 10, textAlign: 'center', padding: 12 }}>Завантаження...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: '#475569', fontSize: 10, textAlign: 'center', padding: 12 }}>Поки пусто. Будь першим!</div>
      ) : (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {entries.map((e, i) => {
            const isMe = currentScore && e.score === currentScore && e.city === currentCity && e.difficulty === currentDifficulty;
            return (
              <div key={e.id} style={{
                display: 'flex', gap: 6, alignItems: 'center',
                padding: '4px 6px', borderRadius: 4, fontSize: 10,
                background: isMe ? '#4ade8015' : (i % 2 === 0 ? '#0f1724' : 'transparent'),
                border: isMe ? '1px solid #4ade8033' : '1px solid transparent',
              }}>
                <span style={{ width: 20, textAlign: 'right', color: i < 3 ? ['#fbbf24', '#94a3b8', '#cd7f32'][i] : '#475569', fontWeight: 700 }}>
                  {i + 1}.
                </span>
                <span style={{ flex: 1, color: '#e2e8f0', fontWeight: 600 }}>{e.name}</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{e.score}</span>
                <span style={{ color: '#64748b', fontSize: 9 }}>💀{e.kills}</span>
                <span style={{ color: '#64748b', fontSize: 9 }}>🌊{e.waves_survived}</span>
                <span style={{ fontSize: 9 }}>{e.device === 'mobile' ? '📱' : e.device === 'tablet' ? '📱' : '💻'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
