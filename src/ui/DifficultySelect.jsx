import { MODES } from '../data/difficulty.js';

export default function DifficultySelect({ cityId, onSelect, onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 800 }}>
        <p style={{ fontSize: 16, marginBottom: 20, color: '#94a3b8' }}>Обери складність</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: '#0c1222',
                border: `2px solid ${m.color}44`,
                color: m.color,
                padding: '20px 22px',
                flex: '1 1 200px',
                maxWidth: 260,
                textAlign: 'left',
                borderRadius: 12,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                minHeight: 'auto',
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
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#cbd5e1', marginBottom: 12 }}>{m.desc}</div>
              <div className="font-mono" style={{ fontSize: 12, lineHeight: 2, color: '#94a3b8' }}>
                <div>🔫 ЗУ: {Math.round(m.turret.hitChance * 100)}%</div>
                <div>🎮 FPV: {Math.round(m.crew.hitChance * 100)}% / {Math.round(m.crew.lossChance * 100)}% втрата</div>
                <div>🛫 Ан-2: {Math.round(m.airfield.hitChance * 100)}%</div>
                <div>💀 Shahed HP: {m.shahed.hp}</div>
                <div>🌊 Хвиль: {m.waves.length}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          style={{
            marginTop: 24, padding: '12px 28px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
            minHeight: 44,
          }}
        >
          ← Назад
        </button>
      </div>
    </div>
  );
}
