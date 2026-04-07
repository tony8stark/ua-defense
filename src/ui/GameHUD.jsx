import { MODES } from '../data/difficulty.js';
import { isMuted, setMuted, resumeOnInteraction } from '../audio/SoundManager.js';
import { useState } from 'react';

export default function GameHUD({ money, killed, score, wave, waveActive, totalWaves, difficulty, buildings, bHp, weather, ewActive }) {
  const m = MODES[difficulty];
  const [muted, _setMuted] = useState(isMuted());

  const toggleMute = () => {
    resumeOnInteraction();
    const next = !muted;
    setMuted(next);
    _setMuted(next);
  };

  return (
    <div style={{
      display: 'flex', gap: 6, fontSize: 12, fontWeight: 700,
      width: '100%', justifyContent: 'space-between', flexWrap: 'wrap',
      padding: '5px 8px', background: '#0c1222', border: '1px solid #1e293b', borderRadius: 6,
      alignItems: 'center',
    }}>
      <span>💰 <span style={{ color: '#fbbf24' }}>{money}</span></span>
      <span>💀 <span style={{ color: '#94a3b8' }}>{killed}</span></span>
      <span>📊 <span style={{ color: '#38bdf8' }}>{score}</span></span>
      <span>🌊 <span style={{ color: '#a78bfa' }}>{wave + (waveActive ? 1 : 0)}/{totalWaves}</span></span>
      {weather && weather.id !== 'clear' && (
        <span style={{ fontSize: 10 }}>{weather.label}</span>
      )}
      {ewActive && (
        <span style={{ fontSize: 10, color: '#f59e0b' }}>⚡РЕБ</span>
      )}
      <span style={{ fontSize: 10, color: m?.color }}>{m?.label}</span>
      <button
        onClick={toggleMute}
        style={{ fontSize: 14, background: 'none', color: muted ? '#475569' : '#e2e8f0', padding: '0 2px' }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <span style={{ display: 'flex', gap: 2 }}>
        {buildings.map(b => (
          <span key={b.key} style={{ fontSize: 14, opacity: (bHp[b.key] || 0) > 0 ? 1 : 0.25 }}>
            {b.emoji}
          </span>
        ))}
      </span>
    </div>
  );
}
