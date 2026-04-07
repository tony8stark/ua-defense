import { DEF_META } from '../data/units.js';

export default function BattleLog({ logs, towers }) {
  function logColor(msg) {
    if (msg.includes('ІСКАНДЕР')) return '#ef4444';
    if (msg.includes('⚠️')) return '#f59e0b';
    if (msg.includes('📡') || msg.includes('РЕБ')) return '#fbbf24';
    if (msg.includes('відбито')) return '#4ade80';
    if (msg.includes('F-16')) return '#38bdf8';
    return '#cbd5e1';
  }

  const topUnits = (towers || [])
    .filter(t => t.hp > 0 && (t.kills || 0) > 0)
    .sort((a, b) => (b.kills || 0) - (a.kills || 0))
    .slice(0, 3);

  return (
    <div style={{
      width: 170, fontSize: 11, borderRadius: 8, padding: 10,
      background: '#111a2b', border: '1px solid #243447', color: '#cbd5e1',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', overflow: 'hidden',
    }}>
      {/* Top units */}
      {topUnits.length > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #243447' }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 6 }}>
            Найкращі
          </div>
          {topUnits.map((t, i) => {
            const meta = DEF_META[t.type];
            return (
              <div key={t.id} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: i === 0 ? '#fbbf24' : '#64748b', fontWeight: 700 }}>{i + 1}.</span>
                <span>{meta?.emoji}</span>
                <span style={{ color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.callsign}</span>
                <span className="font-mono" style={{ color: '#fbbf24', fontWeight: 700 }}>💀{t.kills}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Battle log */}
      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 6, flexShrink: 0 }}>
        Журнал
      </div>
      <div className="scroll-thin" style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0 }}>
        {logs.map((l, i) => (
          <div key={l.t + '' + i} style={{
            lineHeight: 1.4, paddingBottom: 4, marginBottom: 4,
            borderBottom: '1px solid #1e293b33',
            color: logColor(l.msg),
            opacity: Math.max(0.35, 1 - i * 0.05),
            fontSize: 11,
          }}>
            {l.msg}
          </div>
        ))}
        {logs.length === 0 && <div style={{ color: '#64748b' }}>Очікування...</div>}
      </div>
    </div>
  );
}
