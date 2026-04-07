export default function BattleLog({ logs }) {
  function logColor(msg) {
    if (msg.includes('ІСКАНДЕР')) return '#ef4444';
    if (msg.includes('⚠️')) return '#f59e0b';
    if (msg.includes('📡')) return '#f87171';
    if (msg.includes('відбито')) return '#4ade80';
    return '#cbd5e1';
  }

  return (
    <div className="battle-log w-[155px] text-[9px] rounded-md p-2 flex flex-col gap-1 shrink-0 overflow-y-auto"
      style={{ background: '#111a2b', border: '1px solid #243447', color: '#c8d6e5' }}>
      <div className="font-bold text-[8px] uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>
        Бойовий журнал
      </div>
      {logs.map((l, i) => (
        <div key={l.t + '' + i}
          className="leading-snug pb-0.5"
          style={{
            opacity: 1 - i * 0.1,
            borderBottom: '1px solid #1e293b22',
            color: logColor(l.msg),
          }}>
          {l.msg}
        </div>
      ))}
      {logs.length === 0 && <div style={{ color: '#64748b' }}>Очікування...</div>}
    </div>
  );
}
