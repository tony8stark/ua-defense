import { DEF_META } from '../data/units.js';

export default function BattleLog({ logs, towers }) {
  function logColor(msg) {
    if (msg.includes('ІСКАНДЕР')) return '#ef4444';
    if (msg.includes('⚠️')) return '#f59e0b';
    if (msg.includes('📡') || msg.includes('РЕБ')) return '#f87171';
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
      width: 160, fontSize: 10, borderRadius: 6, padding: 8,
      background: '#111a2b', border: '1px solid #243447', color: '#c8d6e5',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100%', // match canvas height
      maxHeight: 'calc(100dvh - 90px)',
      overflow: 'hidden',
    }}>
      {/* Top units - fixed height section at top */}
      {topUnits.length > 0 && (
        <div style={{ flexShrink: 0, paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid #243447' }}>
          <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 4 }}>
            Найкращі
          </div>
          {topUnits.map((t, i) => {
            const meta = DEF_META[t.type];
            return (
              <div key={t.id} style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2, fontSize: 9 }}>
                <span style={{ color: i === 0 ? '#fbbf24' : '#64748b' }}>{i + 1}.</span>
                <span style={{ color: meta?.color || '#94a3b8' }}>{meta?.emoji}</span>
                <span style={{ color: '#cbd5e1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.callsign || '???'}</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>💀{t.kills}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Battle log - scrollable, takes remaining space */}
      <div style={{ fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 4, flexShrink: 0 }}>
        Бойовий журнал
      </div>
      <div style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0, scrollbarWidth: 'thin' }}>
        {logs.map((l, i) => (
          <div key={l.t + '' + i} style={{
            lineHeight: 1.4, paddingBottom: 3, marginBottom: 2,
            borderBottom: '1px solid #1e293b22',
            color: logColor(l.msg),
            opacity: Math.max(0.4, 1 - i * 0.06),
          }}>
            {l.msg}
          </div>
        ))}
        {logs.length === 0 && <div style={{ color: '#64748b' }}>Очікування...</div>}
      </div>
    </div>
  );
}
