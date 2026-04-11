import { MODES } from '../data/difficulty.js';
import { isEndlessMode, getFiniteWaveCount } from '../game/waves.js';

const KOBAYASHI_SCORE_FACTOR = 1_000_000;
const KOBAYASHI_SCORE_CAP = KOBAYASHI_SCORE_FACTOR - 1;
const SCORE_TONE = '#fbbf24';
const WAVE_TONE = '#a78bfa';
const KILLS_TONE = '#f87171';

export function isEndlessDifficulty(difficulty) {
  return isEndlessMode(MODES[difficulty]);
}

export function encodeLeaderboardScore({ difficulty, score, wavesSurvived }) {
  if (!isEndlessDifficulty(difficulty)) return score;

  const safeScore = Math.max(0, Math.min(KOBAYASHI_SCORE_CAP, Math.round(score || 0)));
  const safeWaves = Math.max(0, Math.round(wavesSurvived || 0));
  return safeWaves * KOBAYASHI_SCORE_FACTOR + safeScore;
}

export function decodeLeaderboardScore(entry) {
  if (!isEndlessDifficulty(entry?.difficulty)) {
    return {
      primary: entry?.score || 0,
      secondary: entry?.waves_survived || 0,
    };
  }

  return {
    primary: entry?.waves_survived || 0,
    secondary: (entry?.score || 0) % KOBAYASHI_SCORE_FACTOR,
  };
}

function getAccuracyTone(killRate) {
  if (killRate >= 85) return '#4ade80';
  if (killRate >= 60) return '#f59e0b';
  return '#ef4444';
}

export function getLeaderboardEntryStats(entry) {
  const decoded = decodeLeaderboardScore(entry);
  const score = isEndlessDifficulty(entry?.difficulty) ? decoded.secondary : decoded.primary;
  const waves = Math.max(0, Math.round(entry?.waves_survived || 0));
  const kills = Math.max(0, Math.round(entry?.kills || 0));
  const totalSpawned = Math.max(0, Math.round(entry?.total_spawned || 0));
  // No tracking data (legacy entry) or bugged data (kills > spawned)
  const noStats = totalSpawned <= 0 || kills > totalSpawned;
  const killRate = noStats ? 0 : Math.round((kills / totalSpawned) * 100);
  const killLabel = noStats ? 'N/A' : `${kills}/${totalSpawned}`;

  return {
    score,
    waves,
    kills,
    totalSpawned,
    killRate,
    killLabel,
    noStats,
    stats: [
      { id: 'score', icon: '🏅', label: 'Рахунок', value: score, tone: SCORE_TONE },
      { id: 'waves', icon: '🌊', label: 'Хвилі', value: waves, tone: WAVE_TONE },
      { id: 'kills', icon: '💀', label: 'Збито', value: killLabel, tone: noStats ? '#475569' : KILLS_TONE },
      { id: 'killRate', icon: '🎯', label: '% збиття', value: noStats ? 'N/A' : `${killRate}%`, tone: noStats ? '#475569' : getAccuracyTone(killRate) },
    ],
  };
}

function pushPatch(patches, patch) {
  if (!patch?.id || patches.some(item => item.id === patch.id)) return;
  patches.push(patch);
}

export function getLeaderboardPatches(entry) {
  const stats = getLeaderboardEntryStats(entry);
  const patches = [];
  const endless = isEndlessDifficulty(entry?.difficulty);
  const diff = entry?.difficulty;
  const won = !endless && stats.waves >= getFiniteWaveCount(MODES[diff]);
  const hasStats = !stats.noStats;

  // ── 1. MODE PATCH (always one) ──
  if (endless) {
    pushPatch(patches, { id: 'endless', label: '☠️ Maru Run', tone: '#fb7185' });
  } else if (diff === 'hell') {
    pushPatch(patches, { id: 'hell', label: '🔥 Пекельний контур', tone: '#ef4444' });
  } else if (diff === 'realistic') {
    pushPatch(patches, { id: 'realistic', label: '⚔️ Без ілюзій', tone: '#f59e0b' });
  } else if (diff === 'training') {
    pushPatch(patches, { id: 'training', label: '🎓 Обкатка', tone: '#4ade80' });
  }

  // ── 2. KILL-RATE PATCHES (best one wins) ──
  if (hasStats) {
    if (stats.killRate === 100 && stats.totalSpawned >= 25) {
      pushPatch(patches, { id: 'absolut', label: '💯 Абсолют', tone: '#fbbf24' });
    } else if (stats.killRate >= 95 && stats.totalSpawned >= 30) {
      pushPatch(patches, { id: 'sniper', label: '🎯 Снайпер', tone: '#22d3ee' });
    } else if (stats.killRate >= 90 && stats.totalSpawned >= 18) {
      pushPatch(patches, { id: 'cleanSky', label: '🎯 Чисте небо', tone: '#4ade80' });
    } else if (stats.killRate >= 75 && stats.totalSpawned >= 14) {
      pushPatch(patches, { id: 'steadySky', label: '🛡️ Тримав рубіж', tone: '#38bdf8' });
    }
  }

  // ── 3. CITY PATCHES ──
  if (entry?.city === 'odesa' && hasStats && stats.killRate >= 70) {
    pushPatch(patches, { id: 'odesa', label: '⚓ Морський заслін', tone: '#38bdf8' });
  }
  if (entry?.city === 'kyiv' && stats.waves >= 7) {
    pushPatch(patches, { id: 'kyiv', label: '🏙️ Столичний контур', tone: '#60a5fa' });
  }

  // ── 4. KILL COUNT PATCHES ──
  if (stats.kills >= 100) {
    pushPatch(patches, { id: 'century', label: '🫡 Сотня', tone: '#f87171' });
  } else if (stats.kills >= 60) {
    pushPatch(patches, { id: 'grinder', label: '💀 Мʼясорубка', tone: '#f87171' });
  } else if (stats.kills >= 35) {
    pushPatch(patches, { id: 'hunter', label: '🔻 Вибив хвилю', tone: '#fbbf24' });
  }

  // ── 5. SURVIVAL / ENDURANCE PATCHES ──
  if (endless && stats.waves >= 16) {
    pushPatch(patches, { id: 'veteran', label: '🪖 Ветеран Мару', tone: '#a78bfa' });
  } else if (endless && stats.waves >= 12) {
    pushPatch(patches, { id: 'deepRun', label: '🌊 Дальній рубіж', tone: '#a78bfa' });
  } else if (diff === 'hell' && stats.waves >= 7) {
    pushPatch(patches, { id: 'hellMarathon', label: '⚡ Пекельний марафон', tone: '#ef4444' });
  } else if (diff === 'realistic' && stats.waves >= 10) {
    pushPatch(patches, { id: 'longBuild', label: '🏗️ Довгобуд', tone: '#60a5fa' });
  } else if (!endless && stats.waves >= 8) {
    pushPatch(patches, { id: 'deepRun', label: '🌊 Дальній рубіж', tone: '#a78bfa' });
  }

  // ── 6. FUN / FLAVOR PATCHES (situational, add variety) ──
  if (diff !== 'training' && stats.waves <= 2 && stats.waves > 0) {
    pushPatch(patches, { id: 'flash', label: '🔥 Спалахнув', tone: '#f97316' });
  }
  if (diff === 'training' && won && hasStats && stats.killRate >= 85) {
    pushPatch(patches, { id: 'walk', label: '☕ Прогулянка', tone: '#86efac' });
  }
  if (hasStats && stats.killRate < 40 && stats.killRate > 0 && stats.waves >= 6) {
    pushPatch(patches, { id: 'chaos', label: '📉 Стояв до кінця', tone: '#94a3b8' });
  }
  if (stats.score >= 2000) {
    pushPatch(patches, { id: 'bomber', label: '💣 Бомбардир', tone: '#fbbf24' });
  }
  if (hasStats && stats.kills > 0 && stats.kills <= 5 && stats.waves >= 3) {
    pushPatch(patches, { id: 'pacifist', label: '🕊️ Пацифіст', tone: '#e2e8f0' });
  }

  return patches.slice(0, 4);
}

function getMixedSortScore(entry) {
  if (!isEndlessDifficulty(entry?.difficulty)) return entry?.score || 0;
  return decodeLeaderboardScore(entry).secondary;
}

export function sortLeaderboardEntries(entries, difficulty) {
  const list = [...entries];
  if (isEndlessDifficulty(difficulty)) {
    return list.sort((a, b) =>
      (b.waves_survived - a.waves_survived)
      || (b.score - a.score)
      || (b.kills - a.kills)
      || String(a.created_at || '').localeCompare(String(b.created_at || '')));
  }

  if (!difficulty) {
    return list.sort((a, b) =>
      (getMixedSortScore(b) - getMixedSortScore(a))
      || (b.kills - a.kills)
      || (b.waves_survived - a.waves_survived)
      || String(a.created_at || '').localeCompare(String(b.created_at || '')));
  }

  return list.sort((a, b) =>
    (b.score - a.score)
    || (b.waves_survived - a.waves_survived)
    || (b.kills - a.kills)
    || String(a.created_at || '').localeCompare(String(b.created_at || '')));
}
