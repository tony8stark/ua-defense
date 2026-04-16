-- Leaderboard anti-cheat level 1
--
-- Date: 2026-04-16
-- Applied to: Supabase project `retrogradecosmos` (ref: ogamfoebvducswmxtjas)
--
-- Context:
--   A client-side cheat injected a fake record (rubyVasHacknul, score 99999999,
--   waves 999, 9999/9999). Root cause: public RPC with zero validation, plus
--   RLS policies that allowed direct INSERT/UPDATE from anon role, bypassing
--   the RPC entirely.
--
-- What this migration does:
--   1. Adds helper functions `leaderboard_max_spawns` and `leaderboard_max_waves`
--      with caps derived from src/data/difficulty.js MODES definitions
--      (cumulative wave spawns + 10/wave buffer for orlan/kh101 event spawns).
--   2. Drops both overloaded `upsert_score` versions (7-arg and 8-arg).
--   3. Recreates `upsert_score` with strict validation:
--        - whitelists for difficulty, city, device
--        - name length/char-class checks
--        - non-negative ranges
--        - kills <= total_spawned (strict)
--        - waves_survived <= max per mode
--        - total_spawned <= cumulative cap per mode/waves
--        - endless mode: enforces `floor(score/1M) == waves_survived`
--        - finite mode: score <= max_spawns * 60 + 2000
--   4. Drops direct INSERT/UPDATE RLS policies. Only SELECT stays open.
--      RPC remains the only write path.

-- 1. Helper: max plausible spawns for a run
CREATE OR REPLACE FUNCTION public.leaderboard_max_spawns(p_difficulty text, p_waves integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- Cumulative spawns per wave, includes +10/wave buffer for orlan/kh101 event spawns.
  training_cum  integer[] := ARRAY[0, 14, 31, 48, 69, 91, 119, 156, 199];
  realistic_cum integer[] := ARRAY[0, 15, 35, 60, 88, 116, 148, 184, 225, 280, 349, 432];
  hell_cum      integer[] := ARRAY[0, 14, 33, 57, 83, 120, 164, 215, 276, 346, 430];
  idx integer;
BEGIN
  IF p_waves IS NULL OR p_waves < 0 THEN RETURN 0; END IF;

  IF p_difficulty = 'training' THEN
    idx := LEAST(p_waves + 1, array_length(training_cum, 1));
    RETURN training_cum[idx];
  ELSIF p_difficulty = 'realistic' THEN
    idx := LEAST(p_waves + 1, array_length(realistic_cum, 1));
    RETURN realistic_cum[idx];
  ELSIF p_difficulty = 'hell' THEN
    idx := LEAST(p_waves + 1, array_length(hell_cum, 1));
    RETURN hell_cum[idx];
  ELSIF p_difficulty = 'kobayashiMaru' THEN
    RETURN p_waves * 150 + 100;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- 2. Max plausible waves per mode
CREATE OR REPLACE FUNCTION public.leaderboard_max_waves(p_difficulty text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_difficulty
    WHEN 'training'      THEN 8
    WHEN 'realistic'     THEN 11
    WHEN 'hell'          THEN 10
    WHEN 'kobayashiMaru' THEN 200
    ELSE 0
  END;
$$;

-- 3. Drop both overloaded upsert_score versions
DROP FUNCTION IF EXISTS public.upsert_score(text, integer, text, text, integer, integer, text);
DROP FUNCTION IF EXISTS public.upsert_score(text, integer, text, text, integer, integer, integer, text);

-- 4. Recreate with strict validation
CREATE OR REPLACE FUNCTION public.upsert_score(
  p_name           text,
  p_score          integer,
  p_city           text,
  p_difficulty     text,
  p_waves_survived integer,
  p_kills          integer,
  p_total_spawned  integer DEFAULT 0,
  p_device         text    DEFAULT 'desktop'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_max_waves   integer;
  v_max_spawns  integer;
  v_max_score   integer;
  v_encoded_w   integer;
  v_raw_score   integer;
  v_trimmed     text;
BEGIN
  IF p_difficulty NOT IN ('training','realistic','hell','kobayashiMaru') THEN
    RAISE EXCEPTION 'invalid_difficulty: %', p_difficulty;
  END IF;
  IF p_city NOT IN ('odesa','kyiv') THEN
    RAISE EXCEPTION 'invalid_city: %', p_city;
  END IF;
  IF p_device NOT IN ('desktop','tablet','mobile') THEN
    RAISE EXCEPTION 'invalid_device: %', p_device;
  END IF;

  v_trimmed := btrim(coalesce(p_name, ''));
  IF char_length(v_trimmed) < 2 OR char_length(v_trimmed) > 16 THEN
    RAISE EXCEPTION 'invalid_name_length';
  END IF;
  IF v_trimmed ~ '[<>"\;\\`]|''' THEN
    RAISE EXCEPTION 'invalid_name_chars';
  END IF;

  IF p_score < 0           THEN RAISE EXCEPTION 'score_negative'; END IF;
  IF p_waves_survived < 0  THEN RAISE EXCEPTION 'waves_negative'; END IF;
  IF p_total_spawned < 0   THEN RAISE EXCEPTION 'spawn_negative'; END IF;
  IF p_kills < 0           THEN RAISE EXCEPTION 'kills_negative'; END IF;
  IF p_kills > p_total_spawned THEN
    RAISE EXCEPTION 'kills_over_spawn: kills=% spawn=%', p_kills, p_total_spawned;
  END IF;

  v_max_waves := public.leaderboard_max_waves(p_difficulty);
  IF p_waves_survived > v_max_waves THEN
    RAISE EXCEPTION 'waves_over_max: % > %', p_waves_survived, v_max_waves;
  END IF;

  v_max_spawns := public.leaderboard_max_spawns(p_difficulty, p_waves_survived);
  IF p_total_spawned > v_max_spawns THEN
    RAISE EXCEPTION 'spawn_over_max: % > % (mode=%, waves=%)',
      p_total_spawned, v_max_spawns, p_difficulty, p_waves_survived;
  END IF;

  IF p_difficulty = 'kobayashiMaru' THEN
    v_encoded_w := p_score / 1000000;
    v_raw_score := p_score % 1000000;
    IF v_encoded_w <> p_waves_survived THEN
      RAISE EXCEPTION 'endless_score_waves_mismatch: encoded=%, actual=%',
        v_encoded_w, p_waves_survived;
    END IF;
    IF v_raw_score > 999999 THEN
      RAISE EXCEPTION 'endless_raw_score_too_high: %', v_raw_score;
    END IF;
  ELSE
    v_max_score := v_max_spawns * 60 + 2000;
    IF p_score > v_max_score THEN
      RAISE EXCEPTION 'finite_score_over_max: % > % (mode=%, waves=%)',
        p_score, v_max_score, p_difficulty, p_waves_survived;
    END IF;
  END IF;

  INSERT INTO public.leaderboard
    (name, score, city, difficulty, waves_survived, kills, total_spawned, device)
  VALUES
    (v_trimmed, p_score, p_city, p_difficulty, p_waves_survived, p_kills, p_total_spawned, p_device)
  ON CONFLICT ON CONSTRAINT leaderboard_unique_player
  DO UPDATE SET
    score          = EXCLUDED.score,
    waves_survived = EXCLUDED.waves_survived,
    kills          = EXCLUDED.kills,
    total_spawned  = EXCLUDED.total_spawned,
    device         = EXCLUDED.device,
    created_at     = now()
  WHERE EXCLUDED.score > public.leaderboard.score;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.upsert_score(text, integer, text, text, integer, integer, integer, text)
  TO anon, authenticated;

-- 5. Lock down RLS: only SELECT stays, RPC is the only write path
DROP POLICY IF EXISTS "Anyone can insert scores"     ON public.leaderboard;
DROP POLICY IF EXISTS "Anyone can update own scores" ON public.leaderboard;
