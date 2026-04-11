import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../lib/supabase.js';
import { getLeaderboardEntryStats, getLeaderboardPatches, sortLeaderboardEntries } from '../lib/leaderboard.js';
import { CITIES } from '../data/cities.js';
import { MODES } from '../data/difficulty.js';

function getRankLabel(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}`;
}

function getRankColor(i) {
  if (i === 0) return '#fbbf24';
  if (i === 1) return '#cbd5e1';
  if (i === 2) return '#f97316';
  return '#64748b';
}

function fmt(v) {
  if (typeof v === 'number') return v.toLocaleString('uk-UA');
  return v;
}

export default function Leaderboard({ onBack, highlightName, highlightCity, highlightDifficulty }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState(highlightCity || '');
  const [filterDiff, setFilterDiff] = useState(highlightDifficulty || '');

  useEffect(() => {
    fetchLeaderboard(filterCity || null, filterDiff || null)
      .then(data => {
        setEntries(sortLeaderboardEntries(data, filterDiff || null).slice(0, 25));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterCity, filterDiff]);

  return (
    <div style={shell}>
      <div style={header}>
        <h1 style={title}>🏆 Таблиця рекордів</h1>
        <div style={filters}>
          <select value={filterCity} onChange={e => { setLoading(true); setFilterCity(e.target.value); }} style={select}>
            <option value="">Всі міста</option>
            {Object.values(CITIES).map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
          <select value={filterDiff} onChange={e => { setLoading(true); setFilterDiff(e.target.value); }} style={select}>
            <option value="">Всі складності</option>
            {Object.entries(MODES).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div style={colHeaders}>
        <span style={{ ...colH, width: 32, textAlign: 'center' }}>#</span>
        <span style={{ ...colH, flex: 1, minWidth: 80 }}>Позивний</span>
        <span style={{ ...colH, width: 110 }}>Місто / Режим</span>
        <span style={{ ...colH, width: 64, textAlign: 'right' }}>Рахунок</span>
        <span style={{ ...colH, width: 48, textAlign: 'right' }}>Хвилі</span>
        <span style={{ ...colH, width: 72, textAlign: 'right' }}>Збиття</span>
        <span style={{ ...colH, width: 42, textAlign: 'right' }}>%</span>
        <span style={{ ...colH, width: 120 }}>Патчі</span>
      </div>

      <div style={list}>
        {loading ? (
          <div style={empty}>Завантаження...</div>
        ) : entries.length === 0 ? (
          <div style={empty}>Поки пусто. Будь першим!</div>
        ) : (
          entries.map((entry, i) => {
            const city = CITIES[entry.city];
            const mode = MODES[entry.difficulty];
            const stats = getLeaderboardEntryStats(entry);
            const patches = getLeaderboardPatches(entry);
            const isMine = highlightName && entry.name === highlightName
              && entry.city === highlightCity && entry.difficulty === highlightDifficulty;

            return (
              <div key={entry.id} style={{
                ...row,
                background: isMine ? 'rgba(74, 222, 128, 0.08)' : i % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'transparent',
                borderColor: isMine ? '#4ade8044' : 'transparent',
              }}>
                <span style={{ ...cell, width: 32, textAlign: 'center', color: getRankColor(i), fontWeight: 900, fontSize: 14 }}>
                  {getRankLabel(i)}
                </span>
                <span style={{ ...cell, flex: 1, minWidth: 80, fontWeight: 700, color: isMine ? '#86efac' : '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </span>
                <span style={{ ...cell, width: 110, color: '#94a3b8', fontSize: 11 }}>
                  {city?.emoji} {city?.name} · <span style={{ color: mode?.color || '#94a3b8' }}>{mode?.label?.replace(/^[^\s]+\s/, '')}</span>
                </span>
                <span className="font-mono" style={{ ...cell, width: 64, textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>
                  {fmt(stats.score)}
                </span>
                <span className="font-mono" style={{ ...cell, width: 48, textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>
                  {stats.waves}
                </span>
                <span className="font-mono" style={{ ...cell, width: 72, textAlign: 'right', color: stats.noStats ? '#475569' : '#f87171', fontWeight: 700 }}>
                  {stats.killLabel}
                </span>
                <span className="font-mono" style={{ ...cell, width: 42, textAlign: 'right', color: stats.noStats ? '#475569' : stats.killRate >= 85 ? '#4ade80' : stats.killRate >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                  {stats.noStats ? 'N/A' : `${stats.killRate}%`}
                </span>
                <span style={{ ...cell, width: 120, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {patches.map(p => (
                    <span key={p.id} style={{ ...badge, color: p.tone, borderColor: `${p.tone}40`, background: `${p.tone}14` }}>
                      {p.label}
                    </span>
                  ))}
                </span>
              </div>
            );
          })
        )}
      </div>

      {onBack && (
        <button onClick={onBack} style={backBtn}>← Назад</button>
      )}
    </div>
  );
}

const shell = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px 12px 32px',
  overflowY: 'auto',
  background: 'linear-gradient(160deg, #08111f, #0d1f34 38%, #13283c 64%, #09111f)',
};

const header = {
  width: '100%',
  maxWidth: 820,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
  flexWrap: 'wrap',
};

const title = {
  fontSize: 22,
  fontWeight: 900,
  color: '#f8fafc',
  margin: 0,
  whiteSpace: 'nowrap',
};

const filters = {
  display: 'flex',
  gap: 8,
};

const select = {
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  minHeight: 36,
};

const colHeaders = {
  width: '100%',
  maxWidth: 820,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 10px 6px',
  borderBottom: '1px solid #1e293b',
  marginBottom: 2,
};

const colH = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: '#475569',
};

const list = {
  width: '100%',
  maxWidth: 820,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const empty = {
  color: '#64748b',
  textAlign: 'center',
  padding: '40px 24px',
  fontSize: 14,
};

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid transparent',
  transition: 'background 0.1s',
};

const cell = {
  fontSize: 13,
  lineHeight: 1.3,
};

const badge = {
  fontSize: 9,
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: 999,
  border: '1px solid',
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
};

const backBtn = {
  marginTop: 16,
  padding: '8px 24px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#cbd5e1',
  border: '1px solid #334155',
  minHeight: 36,
};
