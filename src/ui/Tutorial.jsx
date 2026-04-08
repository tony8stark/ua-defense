// Interactive tutorial overlay — shown on first game
import { useState, useEffect } from 'react';

const STEPS = [
  {
    title: 'Ласкаво просимо!',
    text: 'Ти командуєш силами ППО. Завдання: захистити інфраструктуру від ворожих дронів та ракет.',
    highlight: null,
    position: 'center',
  },
  {
    title: 'Обирай зброю',
    text: 'Внизу екрану — панель з типами веж. Обери тип і клікни на карту, щоб поставити.',
    highlight: 'bottom-bar',
    position: 'top',
  },
  {
    title: 'Постав першу вежу',
    text: '🔫 Турель — найдешевша і найточніша. Почни з неї. Клікни на зелену зону на карті.',
    highlight: 'canvas',
    position: 'bottom',
  },
  {
    title: 'Запусти хвилю',
    text: 'Натисни червону кнопку «🚀 Хвиля!» коли будеш готовий. Вороги летітимуть з країв карти.',
    highlight: 'wave-btn',
    position: 'top',
  },
  {
    title: 'Іскандер!',
    text: 'Коли побачиш червоний прицiл — це балістична ракета. Клікни на нього, щоб евакуювати вежі!',
    highlight: null,
    position: 'center',
    emoji: '🚀',
  },
  {
    title: 'Різні вежі',
    text: '🦅 HAWK — проти повільних. 🐆 Gepard — швидкострільний. 💎 IRIS-T — знищує миттєво. 🪤 Хибна ціль — приманка.',
    highlight: null,
    position: 'center',
  },
  {
    title: 'Тривога!',
    text: 'Кнопка 🚨 вмикає режим Тривога — всі вежі стріляють вдвічі швидше 5 секунд. Використовуй у найгарячіші моменти!',
    highlight: null,
    position: 'center',
    emoji: '🚨',
  },
  {
    title: 'Невидимі цілі',
    text: 'Деякі дрони летять низько і невидимі, поки не наблизяться до веж. Ставь оборону вглиб!',
    highlight: null,
    position: 'center',
    emoji: '👻',
  },
  {
    title: 'Готовий!',
    text: 'Стався оборону, збивай ворогів, заробляй гроші на нові вежі. Вдачі, командире!',
    highlight: null,
    position: 'center',
    emoji: '🇺🇦',
  },
];

const STORAGE_KEY = 'ua-tutorial-seen';

export function shouldShowTutorial() {
  try { return !localStorage.getItem(STORAGE_KEY); } catch { return true; }
}

export function markTutorialSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
}

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      markTutorialSeen();
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => {
    markTutorialSeen();
    onClose();
  };

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') next();
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step]);

  return (
    <div
      onClick={next}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: s.position === 'top' ? 'flex-start' : s.position === 'bottom' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: s.position === 'top' ? '60px 16px' : s.position === 'bottom' ? '16px 16px 100px' : '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '2px solid #334155',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {s.emoji && <div style={{ fontSize: 40, marginBottom: 8 }}>{s.emoji}</div>}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>{s.title}</h2>
        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>{s.text}</p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 18 : 6, height: 6, borderRadius: 3,
              background: i === step ? '#fbbf24' : i < step ? '#4ade80' : '#334155',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {!isLast && (
            <button onClick={skip} style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'transparent', color: '#64748b', border: '1px solid #334155', minHeight: 40,
            }}>
              Пропустити
            </button>
          )}
          <button onClick={next} style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: isLast ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#000', minHeight: 40,
          }}>
            {isLast ? '🚀 Почати гру!' : 'Далі →'}
          </button>
        </div>
      </div>
    </div>
  );
}
