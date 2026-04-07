import { CITIES } from '../data/cities.js';

export default function MainMenu({ onSelectCity }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg, #0a1628, #0f2b3d 40%, #1a2a1a 70%, #0c1222)' }}>
      <div className="text-center max-w-xl">
        <div className="text-5xl mb-1">🛡️🇺🇦</div>
        <h1 className="text-2xl font-black tracking-[3px] uppercase mb-1"
          style={{ color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.3)' }}>
          Тривога
        </h1>
        <p className="text-xs mb-6" style={{ color: '#64748b' }}>
          Обери місто для захисту
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {Object.values(CITIES).map(city => (
            <button
              key={city.id}
              onClick={() => onSelectCity(city.id)}
              className="text-left p-4 rounded-xl w-52 transition-all duration-200"
              style={{
                background: '#0c1222',
                border: `2px solid ${city.color}44`,
                color: city.color,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = city.color;
                e.currentTarget.style.boxShadow = `0 0 20px ${city.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = city.color + '44';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="text-2xl mb-1">{city.emoji}</div>
              <div className="text-base font-black mb-1">{city.name}</div>
              <div className="text-[9px] leading-relaxed" style={{ color: '#94a3b8' }}>{city.desc}</div>
              {city.bonuses?.turretAccuracy && (
                <div className="text-[8px] mt-2" style={{ color: '#4ade80' }}>
                  🎯 Patriot: +{Math.round(city.bonuses.turretAccuracy * 100)}% точність турелей
                </div>
              )}
              <div className="text-[8px] mt-1" style={{ color: '#475569' }}>
                📍 {city.spawnEdges.length > 1 ? 'Атака з кількох напрямків' : 'Атака з моря'}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-[10px] leading-relaxed" style={{ color: '#64748b' }}>
          <div className="flex gap-6 justify-center flex-wrap">
            <div>
              <span className="font-bold uppercase text-[8px] tracking-wide" style={{ color: '#4ade80' }}>Оборона</span>
              <div>🔫 Турель · 🎮 Екіпаж FPV · 🛫 Аеродром</div>
            </div>
            <div>
              <span className="font-bold uppercase text-[8px] tracking-wide" style={{ color: '#ef4444' }}>Загрози</span>
              <div>
                <span style={{ color: '#94a3b8' }}>Shahed</span> ·{' '}
                <span style={{ color: '#fbbf24' }}>238</span> ·{' '}
                <span style={{ color: '#cbd5e1' }}>Geran</span> ·{' '}
                <span style={{ color: '#f87171' }}>Lancet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
