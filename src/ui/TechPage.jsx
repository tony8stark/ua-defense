// Техніка — info page showing all units and enemies with descriptions

export default function TechPage({ onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px', overflowY: 'auto',
      background: 'linear-gradient(160deg, #0a1628, #0c1222)',
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#e2e8f0', marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase' }}>
        Техніка
      </h1>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 24 }}>Всі засоби оборони та загрози</p>

      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* DEFENSE */}
        <SectionHeader color="#4ade80">Засоби ППО</SectionHeader>
        {DEFENSE.map(u => <UnitCard key={u.name} {...u} />)}

        {/* MECHANICS */}
        <SectionHeader color="#fbbf24">Механіки</SectionHeader>
        {MECHANICS.map(m => <MechanicCard key={m.name} {...m} />)}

        {/* ENEMIES */}
        <SectionHeader color="#ef4444">Загрози</SectionHeader>
        {ENEMIES.map(e => <UnitCard key={e.name} {...e} />)}

        {/* EVENTS */}
        <SectionHeader color="#a78bfa">Події</SectionHeader>
        {EVENTS.map(e => <MechanicCard key={e.name} {...e} />)}
      </div>

      <button onClick={onBack} style={{
        marginTop: 24, padding: '12px 28px', borderRadius: 8,
        fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
        background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', minHeight: 44,
      }}>
        ← Назад
      </button>
    </div>
  );
}

function SectionHeader({ color, children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color, marginTop: 20, marginBottom: 8, paddingBottom: 4,
      borderBottom: `1px solid ${color}33`,
    }}>
      {children}
    </div>
  );
}

function UnitCard({ emoji, name, color, desc, stats }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 12px', marginBottom: 4,
      background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center' }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: color || '#e2e8f0' }}>{name}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
        {stats && (
          <div className="font-mono" style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{stats}</div>
        )}
      </div>
    </div>
  );
}

function MechanicCard({ emoji, name, color, desc }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '8px 12px', marginBottom: 4,
      background: '#0f172a88', borderRadius: 8,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: 'center' }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: color || '#e2e8f0' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

const DEFENSE = [
  {
    emoji: '🔫', name: 'ЗУ Турель', color: '#4ade80',
    desc: 'Зенітна установка. Надійна, дешева, точна. Основа оборони на ранніх хвилях.',
    stats: 'Дальність: середня | Урон: низький | Точність: висока',
  },
  {
    emoji: '🚗', name: 'МВГ', color: '#22d3ee',
    desc: 'Мобільна вогнева група. Патрулює район на 2 клітинки від позиції. Спеціалізація: +15% точності по швидких цілях (Lancet, Shahed-238).',
    stats: 'Патрулювання: +-2 клітинки | Бонус vs швидкі | Макс: 2-4',
  },
  {
    emoji: '🎮', name: 'Екіпаж FPV', color: '#38bdf8',
    desc: 'Оператори FPV-дронів. Далекобійні, потужні, але дрони іноді втрачають зв\'язок. Не бачать реактивні Shahed-238.',
    stats: 'Дальність: велика | Урон: високий | 7% шанс крит-збиття',
  },
  {
    emoji: '🛫', name: 'Аеродром', color: '#f59e0b',
    desc: 'Кукурузник Ан-2 на патрулюванні. Літає по орбіті, обстрілює цілі в радіусі. Не бачить Shahed-238.',
    stats: 'Дальність: середня | Урон: середній | Патрулювання',
  },
  {
    emoji: '🦅', name: 'HAWK', color: '#a3e635',
    desc: 'Зенітний комплекс проти повільних цілей. Висока точність по Shahed, Geran, Kalibr. Ігнорує швидкі цілі.',
    stats: 'Тільки повільні | Точність: дуже висока | Макс: 1-2',
  },
  {
    emoji: '🐆', name: 'Gepard', color: '#fb923c',
    desc: 'Зенітна артилерія. Дуже короткий радіус, але безперервний вогонь. 2 снаряди за чергу. Ставити на "трасах" ворога.',
    stats: 'Дальність: мала | Скорострільність: макс | Макс: 1-2',
  },
  {
    emoji: '💎', name: 'IRIS-T', color: '#e879f9',
    desc: 'Преміальний зенітний комплекс. Одна ракета за раз, але гарантоване знищення. Цілить по найздоровішому ворогу. Ракети ігнорують ухилення.',
    stats: 'Дальність: велика | Урон: миттєва смерть | Bypass dodge',
  },
  {
    emoji: '🪤', name: 'Хибна ціль', color: '#94a3b8',
    desc: 'Надувна техніка. Відволікає Іскандер (40% шанс) та керовані дрони (60%). Дешева, але ефективна.',
    stats: 'HP: 15 | Приманка | Макс: 4-5',
  },
];

const ENEMIES = [
  {
    emoji: '🛩️', name: 'Shahed-136', color: '#94a3b8',
    desc: 'Іранський дрон-камікадзе. Повільний, багато HP. Основна загроза масових нальотів. 20% можуть летіти низько (невидимі).',
    stats: 'Швидкість: повільна | HP: високий | Ціль: будівлі',
  },
  {
    emoji: '⚡', name: 'Shahed-238', color: '#fbbf24',
    desc: 'Реактивна модифікація. Дуже швидкий, FPV та кукурузники його не бачать. Турелі, МВГ (бонус!), Gepard та IRIS-T ефективні.',
    stats: 'Швидкість: дуже висока | HP: середній | Ціль: будівлі',
  },
  {
    emoji: '🪖', name: 'Geran-2', color: '#cbd5e1',
    desc: 'Середній дрон. Баланс швидкості та HP. 15% можуть летіти низько.',
    stats: 'Швидкість: середня | HP: середній | Іноді цілить вежі',
  },
  {
    emoji: '🎯', name: 'Lancet-3', color: '#f87171',
    desc: 'Барражуючий боєприпас. Швидкий, полює на вежі ППО. Gepard ідеальний проти нього.',
    stats: 'Швидкість: висока | HP: низький | Ціль: вежі',
  },
  {
    emoji: '👁️', name: 'Керований дрон', color: '#ff6b6b',
    desc: 'Оператор-контрольований. Повільний, але величезний HP, ухиляється від атак. Цілить виключно вежі.',
    stats: 'Швидкість: повільна | HP: дуже високий | Dodge: 30-40%',
  },
  {
    emoji: '🔭', name: 'Орлан-10', color: '#6ee7b7',
    desc: 'Розвідник. Не атакує, але якщо пролетить через карту незбитим, наступна хвиля отримає +25-35% HP.',
    stats: 'Швидкість: повільна | HP: низький | Стратегічна загроза',
  },
  {
    emoji: '🚢', name: 'Калібр', color: '#38bdf8',
    desc: 'Крилата ракета з моря. Тільки на карті Одеса. Високий HP, середня швидкість.',
    stats: 'Тільки Одеса | HP: дуже високий | Ціль: будівлі',
  },
  {
    emoji: '✈️', name: 'Кх-101', color: '#c084fc',
    desc: 'Крилата ракета з Ту-95МС. Зʼявляється пакетом по 3-5 штук як подія після 5 хвилі.',
    stats: 'Пакетний запуск | HP: високий | Ціль: будівлі',
  },
  {
    emoji: '🚀', name: 'Іскандер', color: '#ef4444',
    desc: 'Балістична ракета. Зʼявляється як попередження на карті. Можна евакуювати вежі кліком по зоні ураження.',
    stats: 'Прямий удар: знищує | Сплеш: 50% HP | Patriot може перехопити',
  },
];

const MECHANICS = [
  {
    emoji: '🚨', name: 'Тривога!', color: '#fbbf24',
    desc: 'Активна здібність. Всі вежі стріляють вдвічі швидше протягом 5 секунд. Перезарядка 45 секунд.',
  },
  {
    emoji: '🔥', name: 'Combo', color: '#f59e0b',
    desc: 'Серія збиттів за 2.5 секунди дає бонус грошей. x3 (+20%), x5 (+50%), x8 (+80%), x12 (+100%).',
  },
  {
    emoji: '🤝', name: 'Синергія веж', color: '#4ade80',
    desc: 'Різні типи веж поруч одна з одною дають +5% точності кожна (макс +15%). Змішуй типи.',
  },
  {
    emoji: '👻', name: 'Низькі цілі', color: '#94a3b8',
    desc: 'Деякі Shahed та Geran летять низько і невидимі до виявлення на відстані 120px від вежі.',
  },
];

const EVENTS = [
  {
    emoji: '🛩️', name: 'F-16 Viper', color: '#38bdf8',
    desc: 'Союзний винищувач. 12% шанс після 4 хвилі. Випускає 2 ракети AIM-120 по найздоровіших ворогах.',
  },
  {
    emoji: '🛡️', name: 'Patriot', color: '#60a5fa',
    desc: 'Перехоплює Іскандер (25-35% шанс, +10% на Києві). Анімована ракета. Макс 3 перехоплення за гру.',
  },
  {
    emoji: '📡', name: 'Ворожий РЕБ', color: '#f59e0b',
    desc: 'Вмикається посеред хвилі. FPV втрачають зв\'язок в 3 рази частіше, кукурузник точність -50%.',
  },
  {
    emoji: '✈️', name: 'Ту-95МС', color: '#c084fc',
    desc: 'Стратегічний бомбардувальник запускає 3-5 ракет Кх-101. 12-18% шанс після 5 хвилі.',
  },
  {
    emoji: '🌧️', name: 'Погода', color: '#64748b',
    desc: 'Туман (-30% дальність), ніч (-20% точність турелей), вітер (-15% точність + знос цілей).',
  },
  {
    emoji: '📋', name: 'Розвідка', color: '#94a3b8',
    desc: 'Між хвилями показує приблизний склад наступної хвилі (з похибкою +-20%, на Пеклі +-40%).',
  },
];
