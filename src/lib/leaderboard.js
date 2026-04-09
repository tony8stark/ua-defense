import { MODES } from '../data/difficulty.js';
import { isEndlessMode } from '../game/waves.js';

const KOBAYASHI_SCORE_FACTOR = 1_000_000;
const KOBAYASHI_SCORE_CAP = KOBAYASHI_SCORE_FACTOR - 1;

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
