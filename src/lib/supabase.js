// Supabase client for leaderboard
const SUPABASE_URL = 'https://ogamfoebvducswmxtjas.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3mIhORG6U3O0fW82BghX2Q_0V679nuk';

export function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Upsert via DB function: only updates if new score is higher
export async function submitScore({ name, score, city, difficulty, wavesSurvived, kills, totalSpawned }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_score`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_name: name,
      p_score: score,
      p_city: city,
      p_difficulty: difficulty,
      p_waves_survived: wavesSurvived,
      p_kills: kills,
      p_total_spawned: totalSpawned,
      p_device: detectDevice(),
    }),
  });
  return res.ok;
}

export async function fetchLeaderboard(city, difficulty, limit = 25) {
  const params = new URLSearchParams({
    select: 'id,name,score,city,difficulty,waves_survived,kills,total_spawned,device,created_at',
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
