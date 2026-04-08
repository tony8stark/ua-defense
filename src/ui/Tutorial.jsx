// Interactive tutorial overlay — shown on first game
import { useState, useEffect, useCallback } from 'react';
import { markTutorialSeen } from './tutorialStorage.js';

const STEPS = [
  {
    title: 'Ласкаво просимо!',
    text: 'Ти командуєш силами ППО. Завдання: захистити інфраструктуру від ворожих дронів та ракет.',
    emoji: '🛡️',
  },
  {
    title: 'Засоби ураження',
    text: 'Внизу екрану панель із засобами ураження. Обери потрібний тип та клікни на карту, щоб розмістити.',
  },
  {
    title: 'Перший засіб',
    text: '🔫 Турель найдешевша і найточніша. Непоганий вибір для початку. 🚗 МВГ патрулює район і покриває більшу площу.',
  },
  {
    title: 'Запуск хвилі',
    text: 'Кнопка «🚀 Хвиля!» запускає атаку ворога. Між хвилями можна розміщувати нові засоби та ремонтувати будівлі.',
  },
  {
    title: 'Іскандер!',
    text: 'Червоний прицiл на карті означає балістичну ракету. Клікни на нього лише один раз, щоб терміново відвести найближчі засоби з-під удару.',
    emoji: '🚀',
  },
  {
    title: 'Арсенал',
    richText: [
      '🔫 Турель — точний стаціонарний вогонь',
      '🚗 МВГ — мобільний патруль, ширше покриття',
      '🎮 FPV — далекобійні дрони з шансом крит-збиття, але не бачать реактивні Shahed-238',
      '🛫 Аеродром — кукурузник на патрулюванні, теж не працює по Shahed-238',
      '🦅 HAWK — висока точність тільки по повільних цілях',
      '🐆 Gepard — швидкострільна зенітка ближнього бою',
      '💎 IRIS-T — одна ракета, майже гарантоване знищення найздоровішої цілі',
      '🪤 Хибна ціль — відволікає Іскандер та керовані дрони',
    ],
  },
  {
    title: 'Тривога!',
    text: 'Кнопка 🚨 подвоює швидкість стрільби всіх засобів на 5 секунд. Перезарядка 45 секунд. Активуй в найнапруженіший момент.',
    emoji: '🚨',
  },
  {
    title: 'Невидимі цілі',
    text: 'Деякі дрони летять дуже низько і можуть виринути вже глибоко над містом. Тримай частину оборони ближче до критичних обʼєктів.',
    emoji: '👻',
  },
  {
    title: 'В бій!',
    text: 'Розміщуй засоби, збивай ворогів, заробляй гроші на нові закупівлі. Вдачі, друже!',
    emoji: '🇺🇦',
  },
];

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      markTutorialSeen();
      onClose();
    } else {
      setStep(currentStep => currentStep + 1);
    }
  }, [isLast, onClose]);

  const skip = useCallback(() => {
    markTutorialSeen();
    onClose();
  }, [onClose]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') next();
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, skip]);

  return (
    <div
      onClick={next}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '2px solid #334155',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {s.emoji && <div style={{ fontSize: 40, marginBottom: 8, textAlign: 'center' }}>{s.emoji}</div>}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginBottom: 8, textAlign: 'center' }}>{s.title}</h2>
        {s.text && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>{s.text}</p>}
        {s.richText && (
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8, marginBottom: 20, textAlign: 'left' }}>
            {s.richText.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, textAlign: 'center' }}>
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
