import { useState } from 'react';
import { MODES } from '../data/difficulty.js';
import { DEF_META } from '../data/units.js';
import { submitScore } from '../lib/supabase.js';

export default function ResultsScreen({ phase, killed, score, wave, difficulty, bHp, cityId, roster, onMenu, onLeaderboard }) {
  const m = MODES[difficulty];
  const survived = Object.values(bHp).filter(h => h > 0).length;
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('ua-player-name') || ''; } catch { return ''; }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || name.length < 2 || name.length > 16) return;
    setSubmitting(true);
    try { localStorage.setItem('ua-player-name', name.trim()); } catch {}
    const ok = await submitScore({
      name: name.trim(), score, city: cityId, difficulty, wavesSurvived: wave, kills: killed,
    });
    setSubmitting(false);
    if (ok) setSubmitted(true);
  };

  // Sort roster: alive first sorted by kills desc, then dead sorted by kills desc
  const sortedRoster = [...(roster || [])].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return (b.kills || 0) - (a.kills || 0);
  });

  const mvp = sortedRoster.find(u => (u.kills || 0) > 0);
  const totalUnits = sortedRoster.length;
  const destroyedUnits = sortedRoster.filter(u => !u.alive && !u.soldByPlayer).length;
  const soldUnits = sortedRoster.filter(u => u.soldByPlayer).length;

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #0a1628, #0c1222)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 12px', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>{phase === 'won' ? '🇺🇦' : '💥'}</div>
        <h1 style={{
          fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
          color: phase === 'won' ? '#4ade80' : '#ef4444',
        }}>
          {phase === 'won' ? 'Перемога!' : 'Інфраструктуру знищено'}
        </h1>
        <div style={{ fontSize: 11, marginTop: 4, color: m?.color }}>{m?.label}</div>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16,
      }}>
        {[
          { label: 'Рахунок', value: score, color: '#fbbf24' },
          { label: 'Збито', value: killed, color: '#ef4444' },
          { label: 'Хвилі', value: `${wave}/${m?.waves.length || 0}`, color: '#a78bfa' },
          { label: "Об'єкти", value: `${survived}/5`, color: '#4ade80' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Unit roster */}
      {sortedRoster.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 460, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 14px',
          maxHeight: '45dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, flexShrink: 0 }}>
            Особовий склад ({totalUnits} розміщено · {destroyedUnits} знищено{soldUnits > 0 ? ` · ${soldUnits} продано` : ''})
          </div>

          <div style={{ overflowY: 'auto', flex: '1 1 0%', minHeight: 0 }}>
          {sortedRoster.map((u, i) => {
            const meta = DEF_META[u.type];
            const isMVP = mvp && u.id === mvp.id;
            return (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 6, marginBottom: 2,
                background: isMVP ? '#fbbf2410' : (i % 2 === 0 ? '#0f172a' : 'transparent'),
                border: isMVP ? '1px solid #fbbf2433' : '1px solid transparent',
              }}>
                {/* Icon */}
                <span style={{ fontSize: 14, flexShrink: 0 }}>{meta?.emoji || '?'}</span>

                {/* Name + type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: !u.alive ? '#64748b' : (meta?.color || '#e2e8f0'),
                    textDecoration: !u.alive && !u.soldByPlayer ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    "{u.callsign}"{isMVP && ' ⭐'}
                  </div>
                  <div style={{ fontSize: 9, color: '#475569' }}>
                    {meta?.name}{u.soldByPlayer ? ' · продано' : (!u.alive ? ' · знищено' : '')}
                  </div>
                </div>

                {/* Kills */}
                <div style={{
                  fontSize: u.kills > 0 ? 14 : 11, fontWeight: 700, flexShrink: 0,
                  color: u.kills > 0 ? '#fbbf24' : '#334155',
                }}>
                  💀 {u.kills}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Score submission */}
      {!submitted ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Твоє ім'я"
            maxLength={16}
            style={{
              background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
              borderRadius: 6, padding: '10px 14px', fontSize: 14, width: 160,
              fontFamily: "'Courier New', monospace", outline: 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || name.trim().length < 2}
            style={{
              background: submitting ? '#1e293b' : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: submitting ? '#475569' : '#000',
              border: 'none', borderRadius: 6, padding: '10px 20px',
              fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? '...' : '📤 Зберегти'}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 12, fontSize: 13, color: '#4ade80' }}>Результат збережено!</div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onMenu} style={btnStyle}>↩ Меню</button>
        <button onClick={onLeaderboard} style={{ ...btnStyle, color: '#fbbf24' }}>🏆 Рейтинг</button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '10px 24px', fontSize: 13, fontWeight: 700,
  borderRadius: 8, background: '#1e293b', color: '#e2e8f0',
  border: '1px solid #334155', textTransform: 'uppercase', letterSpacing: 1,
};
