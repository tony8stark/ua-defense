import { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../lib/supabase.js';
import { getLeaderboardEntryStats, getLeaderboardPatches, isEndlessDifficulty, sortLeaderboardEntries } from '../lib/leaderboard.js';
import { CITIES } from '../data/cities.js';
import { MODES } from '../data/difficulty.js';

function getRankTone(index) {
  if (index === 0) return { glow: '#fbbf24', surface: '#f59e0b', label: '🥇' };
  if (index === 1) return { glow: '#cbd5e1', surface: '#94a3b8', label: '🥈' };
  if (index === 2) return { glow: '#d97706', surface: '#f97316', label: '🥉' };
  return { glow: '#475569', surface: '#334155', label: `${index + 1}` };
}

function getDeviceGlyph(device) {
  if (device === 'mobile') return '📱';
  if (device === 'tablet') return '📟';
  return '💻';
}

function formatValue(value) {
  if (typeof value === 'number') return value.toLocaleString('uk-UA');
  return value;
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
    <div style={shellStyle}>
      <div style={heroStyle}>
        <div style={eyebrowStyle}>Польовий реєстр</div>
        <h1 style={titleStyle}>🏆 Таблиця рекордів</h1>
        <p style={subtitleStyle}>
          Єдиний формат для кампанії й Kobayashi Maru: рахунок, хвилі, збиття, відсоток перехоплення і патчі за виліт.
        </p>
      </div>

      <div style={filterBarStyle}>
        <select value={filterCity} onChange={e => { setLoading(true); setFilterCity(e.target.value); }} style={selectStyle}>
          <option value="">Всі міста</option>
          {Object.values(CITIES).map(city => (
            <option key={city.id} value={city.id}>{city.emoji} {city.name}</option>
          ))}
        </select>
        <select value={filterDiff} onChange={e => { setLoading(true); setFilterDiff(e.target.value); }} style={selectStyle}>
          <option value="">Всі складності</option>
          {Object.entries(MODES).map(([modeKey, mode]) => (
            <option key={modeKey} value={modeKey}>{mode.label}</option>
          ))}
        </select>
      </div>

      <div style={boardStyle}>
        {loading ? (
          <div style={emptyStateStyle}>Завантаження...</div>
        ) : entries.length === 0 ? (
          <div style={emptyStateStyle}>Поки пусто. Будь першим!</div>
        ) : (
          entries.map((entry, index) => {
            const city = CITIES[entry.city];
            const mode = MODES[entry.difficulty];
            const stats = getLeaderboardEntryStats(entry);
            const scoreStat = stats.stats[0];
            const detailStats = stats.stats.slice(1);
            const patches = getLeaderboardPatches(entry);
            const endless = isEndlessDifficulty(entry.difficulty);
            const rankTone = getRankTone(index);
            const accent = mode?.color || '#fbbf24';
            const isMine = highlightName && entry.name === highlightName && entry.city === highlightCity && entry.difficulty === highlightDifficulty;

            return (
              <div
                key={entry.id}
                style={{
                  ...cardStyle,
                  borderColor: isMine ? '#4ade80aa' : `${accent}30`,
                  boxShadow: isMine
                    ? '0 0 0 1px #4ade8044, 0 20px 50px rgba(8, 15, 30, 0.48)'
                    : '0 20px 50px rgba(8, 15, 30, 0.42)',
                }}
              >
                <div style={{
                  ...cardGlowStyle,
                  background: `linear-gradient(135deg, ${accent}20, transparent 36%, rgba(2, 6, 23, 0.96) 100%)`,
                }} />

                <div style={cardContentStyle}>
                  <div style={{
                    ...rankPlateStyle,
                    color: rankTone.glow,
                    borderColor: `${rankTone.glow}44`,
                    background: `linear-gradient(180deg, ${rankTone.surface}26, rgba(15, 23, 42, 0.82))`,
                  }}>
                    {rankTone.label}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={topRowStyle}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          ...nameStyle,
                          color: isMine ? '#86efac' : '#f8fafc',
                        }}>
                          {entry.name}
                        </div>
                        <div style={metaStyle}>
                          {city?.emoji} {city?.name} · {mode?.label} · {getDeviceGlyph(entry.device)} {entry.device === 'mobile' ? 'мобільний' : entry.device === 'tablet' ? 'планшет' : 'десктоп'}
                          {endless ? ' · ☠️ пріоритет хвиль' : ''}
                        </div>
                      </div>

                      <div style={{
                        ...scorePanelStyle,
                        borderColor: `${accent}44`,
                        background: `linear-gradient(180deg, ${accent}16, rgba(15, 23, 42, 0.9))`,
                      }}>
                        <div style={scoreLabelStyle}>{scoreStat.icon} {scoreStat.label}</div>
                        <div className="font-mono" style={scoreValueStyle}>{formatValue(scoreStat.value)}</div>
                      </div>
                    </div>

                    <div style={statsGridStyle}>
                      {detailStats.map(stat => (
                        <div key={stat.id} style={statCardStyle}>
                          <div style={statLabelStyle}>
                            <span style={{ fontSize: 12 }}>{stat.icon}</span>
                            <span>{stat.label}</span>
                          </div>
                          <div className="font-mono" style={{ ...statValueStyle, color: stat.tone }}>
                            {formatValue(stat.value)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {patches.length > 0 && (
                      <div style={patchRowStyle}>
                        <div style={patchHeadingStyle}>Патчі</div>
                        {patches.map(patch => (
                          <div
                            key={patch.id}
                            className="font-mono"
                            style={{
                              ...patchStyle,
                              color: patch.tone,
                              borderColor: `${patch.tone}4a`,
                              background: `${patch.tone}12`,
                            }}
                          >
                            {patch.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onBack && (
        <button onClick={onBack} style={backButtonStyle}>
          ← Назад
        </button>
      )}
    </div>
  );
}

const shellStyle = {
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 16px 36px',
  overflowY: 'auto',
  background: [
    'radial-gradient(circle at top, rgba(251, 191, 36, 0.16), transparent 28%)',
    'linear-gradient(160deg, #08111f, #0d1f34 38%, #13283c 64%, #09111f)',
  ].join(', '),
};

const heroStyle = {
  width: '100%',
  maxWidth: 760,
  marginBottom: 18,
  padding: '18px 20px',
  borderRadius: 18,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(8, 15, 30, 0.94))',
  boxShadow: '0 18px 48px rgba(2, 6, 23, 0.42)',
};

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 2,
  color: '#7dd3fc',
  marginBottom: 8,
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 900,
  color: '#f8fafc',
  marginBottom: 8,
};

const subtitleStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: '#94a3b8',
  maxWidth: 620,
};

const filterBarStyle = {
  display: 'flex',
  gap: 10,
  marginBottom: 18,
  justifyContent: 'center',
  flexWrap: 'wrap',
  width: '100%',
  maxWidth: 760,
};

const boardStyle = {
  width: '100%',
  maxWidth: 760,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const emptyStateStyle = {
  color: '#64748b',
  textAlign: 'center',
  padding: '48px 24px',
  fontSize: 14,
  borderRadius: 16,
  border: '1px solid rgba(51, 65, 85, 0.8)',
  background: 'rgba(15, 23, 42, 0.7)',
};

const cardStyle = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 18,
  border: '1px solid rgba(51, 65, 85, 0.9)',
  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(9, 17, 31, 0.98))',
};

const cardGlowStyle = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const cardContentStyle = {
  position: 'relative',
  display: 'flex',
  gap: 14,
  alignItems: 'stretch',
  padding: '14px',
};

const rankPlateStyle = {
  width: 54,
  minWidth: 54,
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  fontWeight: 900,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
};

const topRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const nameStyle = {
  fontSize: 18,
  fontWeight: 900,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  letterSpacing: 0.2,
};

const metaStyle = {
  marginTop: 4,
  fontSize: 11,
  lineHeight: 1.5,
  color: '#94a3b8',
};

const scorePanelStyle = {
  minWidth: 132,
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  padding: '10px 12px',
  textAlign: 'right',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
};

const scoreLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.3,
  color: '#94a3b8',
  marginBottom: 6,
};

const scoreValueStyle = {
  fontSize: 24,
  fontWeight: 900,
  color: '#fbbf24',
  lineHeight: 1,
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const statCardStyle = {
  borderRadius: 12,
  border: '1px solid rgba(51, 65, 85, 0.82)',
  background: 'rgba(15, 23, 42, 0.72)',
  padding: '10px 12px',
};

const statLabelStyle = {
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  fontSize: 10,
  lineHeight: 1.3,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  color: '#94a3b8',
  marginBottom: 8,
};

const statValueStyle = {
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.05,
};

const patchRowStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 12,
};

const patchHeadingStyle = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  color: '#64748b',
};

const patchStyle = {
  borderRadius: 999,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const selectStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e2e8f0',
  border: '1px solid #334155',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: 'inherit',
  minHeight: 44,
  boxShadow: '0 12px 32px rgba(2, 6, 23, 0.18)',
};

const backButtonStyle = {
  marginTop: 24,
  padding: '12px 28px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#cbd5e1',
  border: '1px solid #334155',
  minHeight: 44,
};
