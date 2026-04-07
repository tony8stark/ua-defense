import { MODES } from '../data/difficulty.js';

export default function GameHUD({ money, killed, score, wave, waveActive, totalWaves, difficulty, buildings, bHp }) {
  const m = MODES[difficulty];
  return (
    <div className="flex gap-3 text-[11px] font-bold w-full justify-between flex-wrap py-1.5 px-2.5 rounded-md"
      style={{ background: '#0c1222', border: '1px solid #1e293b' }}>
      <span>💰 <span style={{ color: '#fbbf24' }}>{money}</span></span>
      <span>💀 <span style={{ color: '#94a3b8' }}>{killed}</span></span>
      <span>📊 <span style={{ color: '#38bdf8' }}>{score}</span></span>
      <span>🌊 <span style={{ color: '#a78bfa' }}>{wave + (waveActive ? 1 : 0)}/{totalWaves}</span></span>
      <span className="text-[9px]" style={{ color: m?.color }}>{m?.label}</span>
      <span className="flex gap-1">
        {buildings.map(b => (
          <span key={b.key} className="text-[13px]" style={{ opacity: (bHp[b.key] || 0) > 0 ? 1 : 0.25 }}>
            {b.emoji}
          </span>
        ))}
      </span>
    </div>
  );
}
