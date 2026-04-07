import { MODES } from '../data/difficulty.js';

export default function DifficultySelect({ cityId, onSelect, onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 720 }}>
        <p style={{ fontSize: 12, marginBottom: 16, color: '#64748b' }}>Обери складність</p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="rounded-xl transition-all duration-200"
              style={{
                background: '#0c1222',
                border: `2px solid ${m.color}44`,
                color: m.color,
                padding: '18px 20px',
                width: 210,
                textAlign: 'left',
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
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 10, lineHeight: 1.6, color: '#94a3b8', marginBottom: 10 }}>{m.desc}</div>
              <div style={{ fontSize: 9, lineHeight: 1.8, color: '#475569' }}>
                <div>🔫 ЗУ: {Math.round(m.turret.hitChance * 100)}% влучань</div>
                <div>🎮 FPV: {Math.round(m.crew.hitChance * 100)}% влуч / {Math.round(m.crew.lossChance * 100)}% втрата</div>
                <div>🛫 Ан-2: {Math.round(m.airfield.hitChance * 100)}% влучань</div>
                <div>💀 Shahed HP: {m.shahed.hp} | 🚀 238: {m.shahed238.speed}x</div>
                <div>🎯 Lancet→оборона: {Math.round(m.lancet.targetDef * 100)}%</div>
                <div>🌊 Хвиль: {m.waves.length}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          style={{
            marginTop: 20, padding: '10px 24px', borderRadius: 8,
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
          }}
        >
          ← Назад
        </button>
      </div>
    </div>
  );
}
