import { MODES } from '../data/difficulty.js';

export default function ResultsScreen({ phase, killed, score, wave, difficulty, bHp, onMenu }) {
  const m = MODES[difficulty];
  const survived = Object.values(bHp).filter(h => h > 0).length;

  return (
    <div className="min-h-dvh flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg, #0a1628, #0c1222)' }}>
      <div className="text-center">
        <div className="text-5xl mb-2.5">{phase === 'won' ? '🇺🇦' : '💥'}</div>
        <h1 className="text-2xl font-black uppercase tracking-wider"
          style={{ color: phase === 'won' ? '#4ade80' : '#ef4444' }}>
          {phase === 'won' ? 'Перемога!' : 'Інфраструктуру знищено'}
        </h1>
        <div className="text-[11px] mt-1" style={{ color: m?.color }}>{m?.label}</div>
        <div className="text-xs mt-2 leading-loose" style={{ color: '#94a3b8' }}>
          <div>Збито БПЛА: {killed} | Рахунок: {score}</div>
          <div>Вцілілі об'єкти: {survived}/5 | Хвиля: {wave}/{m?.waves.length || 0}</div>
        </div>
        <button
          onClick={onMenu}
          className="mt-4 px-8 py-3 text-xs font-bold rounded-lg uppercase tracking-wide"
          style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
        >
          ↩ Меню
        </button>
      </div>
    </div>
  );
}
