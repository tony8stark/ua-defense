// Supabase client for leaderboard
const SUPABASE_URL = 'https://ogamfoebvducswmxtjas.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3mIhORG6U3O0fW82BghX2Q_0V679nuk';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

export function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export async function submitScore({ name, score, city, difficulty, wavesSurvived, kills }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      score,
      city,
      difficulty,
      waves_survived: wavesSurvived,
      kills,
      device: detectDevice(),
    }),
  });
  return res.ok;
}

export async function fetchLeaderboard(city, difficulty, limit = 20) {
  const params = new URLSearchParams({
    select: 'id,name,score,city,difficulty,waves_survived,kills,device,created_at',
    order: 'score.desc',
    limit: String(limit),
  });
  if (city) params.append('city', `eq.${city}`);
  if (difficulty) params.append('difficulty', `eq.${difficulty}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}
