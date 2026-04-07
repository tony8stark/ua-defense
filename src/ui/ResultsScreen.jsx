import { useState } from 'react';
import { MODES } from '../data/difficulty.js';
import { submitScore } from '../lib/supabase.js';
import Leaderboard from './Leaderboard.jsx';

export default function ResultsScreen({ phase, killed, score, wave, difficulty, bHp, cityId, mvp, onMenu }) {
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
      name: name.trim(),
      score,
      city: cityId,
      difficulty,
      wavesSurvived: wave,
      kills: killed,
    });
    setSubmitting(false);
    if (ok) setSubmitted(true);
  };

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #0a1628, #0c1222)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{phase === 'won' ? '🇺🇦' : '💥'}</div>
        <h1 style={{
          fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
          color: phase === 'won' ? '#4ade80' : '#ef4444',
        }}>
          {phase === 'won' ? 'Перемога!' : 'Інфраструктуру знищено'}
        </h1>
        <div style={{ fontSize: 11, marginTop: 4, color: m?.color }}>{m?.label}</div>
        <div style={{ fontSize: 12, marginTop: 8, color: '#94a3b8', lineHeight: 1.8 }}>
          <div>Збито БПЛА: {killed} | Рахунок: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{score}</span></div>
          <div>Вцілілі об'єкти: {survived}/5 | Хвиля: {wave}/{m?.waves.length || 0}</div>
        </div>

        {/* MVP unit */}
        {mvp && (
          <div style={{
            marginTop: 10, padding: '6px 12px', borderRadius: 6,
            background: '#1e293b', border: '1px solid #334155', display: 'inline-block',
          }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>MVP</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
              "{mvp.callsign}" - {mvp.kills} збитих
            </div>
          </div>
        )}

        {/* Score submission */}
        {!submitted ? (
          <div style={{ marginTop: 14, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Твоє ім'я"
              maxLength={16}
              style={{
                background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
                borderRadius: 6, padding: '8px 12px', fontSize: 12, width: 140,
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
                border: 'none', borderRadius: 6, padding: '8px 16px',
                fontSize: 12, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? '...' : '📤 Надіслати'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 11, color: '#4ade80' }}>Результат збережено!</div>
        )}

        <button
          onClick={onMenu}
          style={{
            marginTop: 14, padding: '10px 28px', fontSize: 12, fontWeight: 700,
            borderRadius: 8, background: '#1e293b', color: '#e2e8f0',
            border: '1px solid #334155', textTransform: 'uppercase', letterSpacing: 1,
          }}
        >
          ↩ Меню
        </button>
      </div>

      {/* Leaderboard */}
      <Leaderboard currentCity={cityId} currentDifficulty={difficulty} currentScore={submitted ? score : null} />
    </div>
  );
}
