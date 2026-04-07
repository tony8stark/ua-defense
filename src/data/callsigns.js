// Ukrainian-themed callsigns for defense units
const CALLSIGNS = [
  'Мавка', 'Вовк', 'Привид', 'Валькірія', 'Сокіл',
  'Джміль', 'Козак', 'Берегиня', 'Фурія', 'Шершень',
  'Байрактар', 'Чумак', 'Характерник', 'Відьма', 'Яструб',
  'Кобзар', 'Мольфар', 'Домовик', 'Тризуб', 'Вій',
  'Оса', 'Беркут', 'Лис', 'Химера', 'Варта',
  'Стріла', 'Гром', 'Іскра', 'Промінь', 'Щит',
];

let _usedCallsigns = new Set();

export function resetCallsigns() {
  _usedCallsigns = new Set();
}

export function getCallsign() {
  const available = CALLSIGNS.filter(c => !_usedCallsigns.has(c));
  const pick = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : CALLSIGNS[Math.floor(Math.random() * CALLSIGNS.length)] + '-' + Math.floor(Math.random() * 99);
  _usedCallsigns.add(pick);
  return pick;
}
