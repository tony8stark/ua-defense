import { useState } from 'react';
import { MODES } from '../data/difficulty.js';
import { DEF_META } from '../data/units.js';
import { submitScore } from '../lib/supabase.js';
import { encodeLeaderboardScore, getLeaderboardPatches } from '../lib/leaderboard.js';
import { getWaveDisplayTotal, isEndlessMode } from '../game/waves.js';

const ENEMY_META = {
  shahed: { name: 'Shahed-136', emoji: '🛩️', color: '#94a3b8' },
  shahed238: { name: 'Shahed-238', emoji: '⚡', color: '#fbbf24' },
  geran: { name: 'Geran-2', emoji: '🪖', color: '#cbd5e1' },
  lancet: { name: 'Lancet-3', emoji: '🎯', color: '#f87171' },
  guided: { name: 'Керований', emoji: '👁️', color: '#ff6b6b' },
  orlan: { name: 'Орлан-10', emoji: '🔭', color: '#6ee7b7' },
  kalibr: { name: 'Калібр', emoji: '🚢', color: '#38bdf8' },
  kh101: { name: 'Кх-101', emoji: '✈️', color: '#c084fc' },
};

export default function ResultsScreen({ phase, killed, score, wave, difficulty, bHp, cityId, roster, totalSpawned, spawnedByType, killedByType, patriotInterceptions, bestCombo, telemetry, onMenu, onLeaderboard }) {
  const m = MODES[difficulty];
  const endless = isEndlessMode(m);
  const waveTotalLabel = getWaveDisplayTotal(m);
  const survived = Object.values(bHp).filter(h => h > 0).length;
  const killRate = totalSpawned > 0 ? Math.round((killed / totalSpawned) * 100) : 0;
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('ua-player-name') || '';
    } catch {
      return '';
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const encodedScore = encodeLeaderboardScore({ difficulty, score, wavesSurvived: wave });
  const earnedPatches = getLeaderboardPatches({
    difficulty,
    city: cityId,
    score: encodedScore,
    waves_survived: wave,
    kills: killed,
    total_spawned: totalSpawned || 0,
  });

  const handleSubmit = async () => {
    if (!name.trim() || name.length < 2 || name.length > 16) return;
    setSubmitting(true);
    try {
      localStorage.setItem('ua-player-name', name.trim());
    } catch {
      // Ignore storage failures and continue with score submission.
    }
    const ok = await submitScore({
      name: name.trim(),
      score: encodedScore,
      city: cityId,
      difficulty,
      wavesSurvived: wave,
      kills: killed,
      totalSpawned: totalSpawned || 0,
    });
    setSubmitting(false);
    if (ok) setSubmitted(true);
  };

  const sortedRoster = [...(roster || [])].sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    return (b.kills || 0) - (a.kills || 0);
  });

  const mvp = sortedRoster.find(u => (u.kills || 0) > 0);
  const totalUnits = sortedRoster.length;
  const destroyedUnits = sortedRoster.filter(u => !u.alive && !u.soldByPlayer).length;
  const soldUnits = sortedRoster.filter(u => u.soldByPlayer).length;
  const resultIcon = phase === 'won' ? '🇺🇦' : endless ? '☠️' : '💥';
  const resultColor = phase === 'won' ? '#4ade80' : endless ? '#fb7185' : '#ef4444';
  const resultTitle = phase === 'won' ? 'Перемога!' : endless ? 'Kobayashi Maru' : 'Інфраструктуру знищено';

  // Build enemy breakdown (only types that actually spawned)
  const enemyBreakdown = spawnedByType ? Object.entries(spawnedByType)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a) : [];
  const economy = telemetry?.economy || null;
  const unitEconomy = telemetry ? Object.values(telemetry.byType)
    .filter(entry => entry.placed > 0)
    .sort((a, b) => (b.kills - a.kills) || (b.netSpend - a.netSpend)) : [];

  return (
    <div style={{
      height: '100dvh', background: 'linear-gradient(160deg, #0a1628, #0c1222)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{resultIcon}</div>
        <h1 style={{
          fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
          color: resultColor,
        }}>
          {resultTitle}
        </h1>
        <div style={{ fontSize: 12, marginTop: 4, color: m?.color }}>{m?.label}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Рахунок', value: score, color: '#fbbf24' },
          { label: 'Збито', value: totalSpawned > 0 ? `${killed}/${totalSpawned}` : killed, color: '#ef4444' },
          { label: '% збиття', value: `${killRate}%`, color: killRate >= 80 ? '#4ade80' : killRate >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'Хвилі', value: `${wave}/${waveTotalLabel}`, color: '#a78bfa' },
          { label: "Об'єкти", value: `${survived}/5`, color: '#4ade80' },
          ...(patriotInterceptions > 0 ? [{ label: 'Patriot', value: patriotInterceptions, color: '#60a5fa' }] : []),
          ...(bestCombo >= 3 ? [{ label: 'Серія', value: `x${bestCombo}`, color: '#f59e0b' }] : []),
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div className="font-mono" style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {earnedPatches.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 480, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Патчі за виліт
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {earnedPatches.map(patch => (
              <div
                key={patch.id}
                className="font-mono"
                style={{
                  borderRadius: 999,
                  border: `1px solid ${patch.tone}40`,
                  background: `${patch.tone}14`,
                  color: patch.tone,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '6px 10px',
                }}
              >
                {patch.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {economy && (
        <div style={{
          width: '100%', maxWidth: 480, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Логістика
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Закупівлі', value: economy.totalSpent, color: '#fbbf24' },
              { label: 'Ремонт', value: economy.repairSpent, color: '#38bdf8' },
              { label: 'Повернуто', value: economy.totalRefund, color: '#4ade80' },
              { label: 'Нетто', value: economy.netSpent, color: '#f87171' },
              { label: 'Цивільні', value: telemetry.civilianHits, color: telemetry.civilianHits > 0 ? '#ef4444' : '#64748b' },
            ].map(item => (
              <div key={item.label} style={{ minWidth: 72 }}>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unitEconomy.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 480, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Ефективність засобів
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unitEconomy.map(entry => {
              const meta = DEF_META[entry.type];
              return (
                <div key={entry.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, textAlign: 'center', flexShrink: 0 }}>{meta?.emoji}</span>
                  <span style={{ minWidth: 88, fontSize: 12, color: meta?.color || '#e2e8f0' }}>{meta?.name}</span>
                  <span className="font-mono" style={{ fontSize: 11, color: '#fbbf24', minWidth: 54 }}>
                    💀{entry.kills}
                  </span>
                  <span className="font-mono" style={{ fontSize: 11, color: '#94a3b8', minWidth: 56 }}>
                    💰{entry.netSpend}
                  </span>
                  <span className="font-mono" style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                    {entry.placed} шт · {entry.destroyed} втрат{entry.sold > 0 ? ` · ${entry.sold} прод.` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enemy breakdown */}
      {enemyBreakdown.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 480, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Розбивка по типах
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {enemyBreakdown.map(([type, spawned]) => {
              const kills = killedByType?.[type] || 0;
              const rate = spawned > 0 ? Math.round((kills / spawned) * 100) : 0;
              const meta = ENEMY_META[type];
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0 }}>{meta?.emoji}</span>
                  <span style={{ fontSize: 12, color: meta?.color || '#94a3b8', minWidth: 90 }}>{meta?.name}</span>
                  <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${rate}%`, height: '100%', borderRadius: 3,
                      background: rate >= 80 ? '#4ade80' : rate >= 50 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <span className="font-mono" style={{
                    fontSize: 12, color: rate >= 80 ? '#4ade80' : rate >= 50 ? '#f59e0b' : '#ef4444',
                    minWidth: 70, textAlign: 'right',
                  }}>
                    {kills}/{spawned} ({rate}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roster */}
      {sortedRoster.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 480, marginBottom: 16,
          background: '#0c1222', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px',
          maxHeight: '35dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, flexShrink: 0 }}>
            Особовий склад ({totalUnits} розм. · {destroyedUnits} знищ.{soldUnits > 0 ? ` · ${soldUnits} прод.` : ''})
          </div>
          <div className="scroll-thin" style={{ overflowY: 'auto', flex: '1 1 0%', minHeight: 0 }}>
            {sortedRoster.map((u, i) => {
              const meta = DEF_META[u.type];
              const isMVP = mvp && u.id === mvp.id;
              return (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 6, marginBottom: 2,
                  background: isMVP ? '#fbbf2415' : (i % 2 === 0 ? '#0f172a' : 'transparent'),
                  border: isMVP ? '1px solid #fbbf2440' : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{meta?.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: !u.alive ? '#64748b' : (meta?.color || '#e2e8f0'),
                      textDecoration: !u.alive && !u.soldByPlayer ? 'line-through' : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      "{u.callsign}"{isMVP && ' ⭐'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {meta?.name}{u.soldByPlayer ? ' · продано' : (!u.alive ? ' · знищено' : '')}
                    </div>
                  </div>
                  <div className="font-mono" style={{
                    fontSize: u.kills > 0 ? 14 : 12, fontWeight: 700, flexShrink: 0,
                    color: u.kills > 0 ? '#fbbf24' : '#334155',
                  }}>
                    💀 {u.kills}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit */}
      {!submitted ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Твоє ім'я"
            maxLength={16}
            style={{
              background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
              borderRadius: 8, padding: '12px 16px', fontSize: 14, width: 180,
              outline: 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || name.trim().length < 2}
            style={{
              background: submitting ? '#1e293b' : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: submitting ? '#64748b' : '#000',
              borderRadius: 8, padding: '12px 20px',
              fontSize: 14, fontWeight: 700, minHeight: 44,
            }}
          >
            {submitting ? '...' : '📤 Зберегти'}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 16, fontSize: 14, color: '#4ade80', fontWeight: 600 }}>Результат збережено!</div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onMenu} style={btnStyle}>↩ Меню</button>
        <button onClick={onLeaderboard} style={{ ...btnStyle, color: '#fbbf24', borderColor: '#fbbf2433' }}>🏆 Рейтинг</button>
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '12px 24px', fontSize: 14, fontWeight: 700,
  borderRadius: 8, background: '#1e293b', color: '#e2e8f0',
  border: '1px solid #334155', textTransform: 'uppercase', letterSpacing: 1,
  minHeight: 44,
};
