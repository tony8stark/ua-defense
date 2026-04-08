import { CITIES } from '../data/cities.js';

export default function MainMenu({ onSelectCity, onShowLeaderboard }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'safe center', justifyContent: 'center',
      padding: '24px 12px', overflowY: 'auto',
      background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 640 }}>
        <div style={{ fontSize: 52, marginBottom: 4 }}>🛡️🇺🇦</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          marginBottom: 4, color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.3)',
        }}>
          Симулятор ППО
        </h1>
        <p style={{ fontSize: 14, marginBottom: 24, color: '#94a3b8' }}>
          Обери місто для захисту
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {Object.values(CITIES).map(city => (
            <button
              key={city.id}
              onClick={() => onSelectCity(city.id)}
              style={{
                background: '#0c1222',
                border: `2px solid ${city.color}44`,
                color: city.color,
                padding: '20px 22px',
                flex: '1 1 240px',
                maxWidth: 300,
                textAlign: 'left',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                minHeight: 'auto',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = city.color;
                e.currentTarget.style.boxShadow = `0 0 24px ${city.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = city.color + '44';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{city.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{city.name}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: '#cbd5e1', marginBottom: 12 }}>{city.desc}</div>
              <div style={{ marginTop: 'auto' }}>
                {city.hints?.map((hint, i) => (
                  <div key={i} style={{ fontSize: 12, lineHeight: 1.8, color: '#94a3b8' }}>{hint}</div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 13, lineHeight: 1.8, color: '#94a3b8' }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, color: '#4ade80' }}>Оборона</span>
              <div>🔫 Турель · 🎮 FPV · 🛫 Аеродром</div>
              <div>🦅 HAWK · 🐆 Gepard · 💎 IRIS-T</div>
            </div>
            <div>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, color: '#ef4444' }}>Загрози</span>
              <div>
                <span style={{ color: '#cbd5e1' }}>Shahed</span> ·{' '}
                <span style={{ color: '#fbbf24' }}>238</span> ·{' '}
                <span style={{ color: '#e2e8f0' }}>Geran</span> ·{' '}
                <span style={{ color: '#f87171' }}>Lancet</span>
              </div>
              <div>
                <span style={{ color: '#38bdf8' }}>Kalibr</span> ·{' '}
                <span style={{ color: '#c084fc' }}>Kh-101</span> ·{' '}
                <span style={{ color: '#6ee7b7' }}>Orlan</span> ·{' '}
                <span style={{ color: '#ff6b6b' }}>Iskander</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>🚨 Тривога!</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>🛡️ Patriot</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>🛩️ F-16</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>🔥 Combo</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>📡 РЕБ</span>
          </div>
        </div>

        <button
          onClick={onShowLeaderboard}
          style={{
            marginTop: 24, padding: '12px 28px', borderRadius: 8,
            fontSize: 14, fontWeight: 700, background: '#1e293b',
            color: '#fbbf24', border: '1px solid #fbbf2433',
            minHeight: 44,
          }}
        >
          🏆 Таблиця рекордів
        </button>
      </div>
    </div>
  );
}
