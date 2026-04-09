import { MODES } from '../data/difficulty.js';
import { isEndlessMode } from '../game/waves.js';

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
  const killRate = totalSpawned > 0 ? Math.round((kills / totalSpawned) * 100) : 0;
  const killLabel = totalSpawned > 0 ? `${kills}/${totalSpawned}` : String(kills);

  return {
    score,
    waves,
    kills,
    totalSpawned,
    killRate,
    killLabel,
    stats: [
      { id: 'score', icon: '🏅', label: 'Рахунок', value: score, tone: SCORE_TONE },
      { id: 'waves', icon: '🌊', label: 'Хвилі', value: waves, tone: WAVE_TONE },
      { id: 'kills', icon: '💀', label: 'Збито', value: killLabel, tone: KILLS_TONE },
      { id: 'killRate', icon: '🎯', label: '% збиття', value: `${killRate}%`, tone: getAccuracyTone(killRate) },
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

  if (endless) {
    pushPatch(patches, { id: 'endless', label: '☠️ Maru Run', tone: '#fb7185' });
  } else if (entry?.difficulty === 'hell') {
    pushPatch(patches, { id: 'hell', label: '🔥 Пекельний контур', tone: '#ef4444' });
  } else if (entry?.difficulty === 'realistic') {
    pushPatch(patches, { id: 'realistic', label: '⚔️ Без ілюзій', tone: '#f59e0b' });
  } else if (entry?.difficulty === 'training') {
    pushPatch(patches, { id: 'training', label: '🎓 Обкатка', tone: '#4ade80' });
  }

  if (stats.killRate >= 90 && stats.totalSpawned >= 18) {
    pushPatch(patches, { id: 'cleanSky', label: '🎯 Чисте небо', tone: '#4ade80' });
  } else if (stats.killRate >= 75 && stats.totalSpawned >= 14) {
    pushPatch(patches, { id: 'steadySky', label: '🛡️ Тримав рубіж', tone: '#38bdf8' });
  }

  if (entry?.city === 'odesa' && stats.killRate >= 70) {
    pushPatch(patches, { id: 'odesa', label: '⚓ Морський заслін', tone: '#38bdf8' });
  }
  if (entry?.city === 'kyiv' && stats.waves >= 7) {
    pushPatch(patches, { id: 'kyiv', label: '🏙️ Столичний контур', tone: '#60a5fa' });
  }

  if (stats.kills >= 60) {
    pushPatch(patches, { id: 'grinder', label: '💀 Мʼясорубка', tone: '#f87171' });
  } else if (stats.kills >= 35) {
    pushPatch(patches, { id: 'hunter', label: '🔻 Вибив хвилю', tone: '#fbbf24' });
  }

  if (stats.waves >= (endless ? 12 : 8)) {
    pushPatch(patches, { id: 'deepRun', label: '🌊 Дальній рубіж', tone: '#a78bfa' });
  }

  return patches.slice(0, 3);
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
