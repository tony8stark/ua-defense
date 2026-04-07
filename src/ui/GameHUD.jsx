import { MODES } from '../data/difficulty.js';
import { isMuted, setMuted, resumeOnInteraction } from '../audio/SoundManager.js';
import { useState } from 'react';

export default function GameHUD({ money, killed, score, wave, waveActive, totalWaves, difficulty, buildings, bHp, weather, ewActive }) {
  const m = MODES[difficulty];
  const [muted, _setMuted] = useState(isMuted());

  const toggleMute = () => {
    resumeOnInteraction();
    setMuted(!muted);
    _setMuted(!muted);
  };

  return (
    <div style={{
      display: 'flex', gap: 8, fontSize: 13, fontWeight: 700,
      width: '100%', justifyContent: 'space-between', flexWrap: 'nowrap',
      padding: '6px 10px', background: '#0c1222', border: '1px solid #1e293b', borderRadius: 8,
      alignItems: 'center', overflow: 'hidden',
    }}>
      <span className="font-mono">💰<span style={{ color: '#fbbf24' }}>{money}</span></span>
      <span className="font-mono">💀<span style={{ color: '#cbd5e1' }}>{killed}</span></span>
      <span className="font-mono">🌊<span style={{ color: '#a78bfa' }}>{wave + (waveActive ? 1 : 0)}/{totalWaves}</span></span>
      {weather && weather.id !== 'clear' && (
        <span style={{ fontSize: 11 }}>{weather.label}</span>
      )}
      {ewActive && (
        <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 800 }}>⚡ВОРОЖИЙ РЕБ</span>
      )}
      <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {buildings.map(b => (
          <span key={b.key} style={{ fontSize: 13, opacity: (bHp[b.key] || 0) > 0 ? 1 : 0.2 }}>
            {b.emoji}
          </span>
        ))}
      </span>
      <button
        onClick={toggleMute}
        style={{
          fontSize: 16, background: 'none', color: muted ? '#475569' : '#e2e8f0',
          padding: '4px 8px', minHeight: 36, minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, borderRadius: 6,
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
