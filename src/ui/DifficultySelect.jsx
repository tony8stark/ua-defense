import { MODES } from '../data/difficulty.js';

export default function DifficultySelect({ cityId, onSelect, onBack }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)' }}>
      <div className="text-center max-w-xl">
        <p className="text-xs mb-4" style={{ color: '#64748b' }}>Обери складність</p>

        <div className="flex gap-2 justify-center flex-wrap">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="text-left p-3.5 rounded-xl w-44 transition-all duration-200"
              style={{
                background: '#0c1222',
                border: `2px solid ${m.color}44`,
                color: m.color,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = m.color;
                e.currentTarget.style.boxShadow = `0 0 20px ${m.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = m.color + '44';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="text-base font-black mb-1.5">{m.label}</div>
              <div className="text-[9px] leading-relaxed" style={{ color: '#94a3b8' }}>{m.desc}</div>
              <div className="text-[8px] mt-2 leading-relaxed" style={{ color: '#475569' }}>
                <div>🔫 ЗУ: {Math.round(m.turret.hitChance * 100)}% влучань</div>
                <div>🎮 FPV: {Math.round(m.crew.hitChance * 100)}% влуч / {Math.round(m.crew.lossChance * 100)}% втрата</div>
                <div>🛫 Ан-2: {Math.round(m.airfield.hitChance * 100)}% влучань</div>
                <div>💀 Shahed HP: {m.shahed.hp} | 🚀 238 швид: {m.shahed238.speed}x</div>
                <div>🎯 Lancet→оборона: {Math.round(m.lancet.targetDef * 100)}%</div>
                <div>🌊 Хвиль: {m.waves.length}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-5 px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider font-bold"
          style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
        >
          ← Назад
        </button>
      </div>
    </div>
  );
}
