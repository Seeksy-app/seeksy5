-- Add missing columns to trucking_call_logs (only what doesn't exist)
ALTER TABLE public.trucking_call_logs
  ADD COLUMN IF NOT EXISTS was_premium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS was_high_intent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sentiment_score double precision,
  ADD COLUMN IF NOT EXISTS sentiment_label text,
  ADD COLUMN IF NOT EXISTS emotion_flags text[],
  ADD COLUMN IF NOT EXISTS confidence_score int,
  ADD COLUMN IF NOT EXISTS cei_score int,
  ADD COLUMN IF NOT EXISTS cei_band text;

-- Helper: compute CEI band
CREATE OR REPLACE FUNCTION public.cei_band(score int)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN score IS NULL THEN NULL
    WHEN score < 25 THEN '0-24'
    WHEN score < 50 THEN '25-49'
    WHEN score < 75 THEN '50-74'
    WHEN score < 90 THEN '75-89'
    ELSE '90-100'
  END;
$$;

-- Helper: compute CEI score (v1)
CREATE OR REPLACE FUNCTION public.compute_cei(
  _sentiment_score double precision,
  _outcome text,
  _duration_seconds int,
  _was_high_intent boolean
)
RETURNS int
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  sentiment_0_100 int;
  outcome_quality int;
  engagement_quality int;
  resolution_success int;
  score int;
BEGIN
  -- sentiment -1..+1 -> 0..100
  IF _sentiment_score IS NULL THEN
    sentiment_0_100 := 50;
  ELSE
    sentiment_0_100 := greatest(0, least(100, round(((_sentiment_score + 1.0) / 2.0) * 100.0)::numeric));
  END IF;

  outcome_quality := CASE coalesce(_outcome,'')
    WHEN 'booked' THEN 100
    WHEN 'callback_requested' THEN 100
    WHEN 'lead_created' THEN 75
    WHEN 'resolved' THEN 70
    WHEN 'hangup' THEN 0
    WHEN 'error' THEN 0
    ELSE 50
  END;

  engagement_quality := CASE
    WHEN coalesce(_duration_seconds,0) > 90 THEN 100
    WHEN coalesce(_duration_seconds,0) >= 45 THEN 70
    ELSE 30
  END;

  resolution_success := CASE
    WHEN coalesce(_outcome,'') IN ('booked','callback_requested') THEN 100
    WHEN coalesce(_outcome,'') IN ('resolved','lead_created') THEN 70
    WHEN coalesce(_was_high_intent,false) = true THEN 100
    ELSE 0
  END;

  score := round(
      0.30 * sentiment_0_100
    + 0.30 * outcome_quality
    + 0.20 * engagement_quality
    + 0.20 * resolution_success
  )::int;

  RETURN greatest(0, least(100, score));
END;
$$;

-- View: daily calls (CST) - adapted to use existing column names
CREATE OR REPLACE VIEW public.v_trucking_calls_daily_cst AS
SELECT
  c.*,
  ((coalesce(c.call_started_at, c.created_at)) AT TIME ZONE 'America/Chicago')::date AS call_date_cst
FROM public.trucking_call_logs c
WHERE c.deleted_at IS NULL;

-- View: KPI rollup for a given day (CST)
CREATE OR REPLACE VIEW public.v_trucking_call_kpis_by_day_cst AS
SELECT
  call_date_cst,
  count(*) AS total_calls,
  count(*) FILTER (WHERE coalesce(duration_seconds,0) > 0) AS connected_calls,
  count(*) FILTER (WHERE coalesce(duration_seconds,0) < 30) AS quick_hangups,
  count(*) FILTER (WHERE outcome='lead_created') AS leads_created,
  count(*) FILTER (WHERE outcome IN ('booked','callback_requested')) AS successful_outcomes,
  count(*) FILTER (WHERE outcome='booked') AS booked,
  count(*) FILTER (WHERE outcome='callback_requested') AS callback_requested,
  count(*) FILTER (WHERE was_high_intent=true OR was_premium=true) AS high_intent_calls,
  round(avg(coalesce(cei_score, public.compute_cei(sentiment_score, outcome, duration_seconds, was_high_intent))), 1) AS avg_cei,
  count(*) FILTER (WHERE sentiment_label='negative') AS negative_calls,
  count(*) FILTER (WHERE sentiment_label='neutral') AS neutral_calls,
  count(*) FILTER (WHERE sentiment_label='positive') AS positive_calls
FROM public.v_trucking_calls_daily_cst
GROUP BY call_date_cst;

-- View: CEI band breakdown (for the chart)
CREATE OR REPLACE VIEW public.v_trucking_cei_band_by_day_cst AS
SELECT
  call_date_cst,
  public.cei_band(coalesce(cei_score, public.compute_cei(sentiment_score, outcome, duration_seconds, was_high_intent))) AS cei_band,
  count(*) AS calls
FROM public.v_trucking_calls_daily_cst
GROUP BY call_date_cst, public.cei_band(coalesce(cei_score, public.compute_cei(sentiment_score, outcome, duration_seconds, was_high_intent)));

-- View: emotion distribution (for the chart)
CREATE OR REPLACE VIEW public.v_trucking_emotions_by_day_cst AS
SELECT
  call_date_cst,
  emotion,
  count(*) AS calls
FROM (
  SELECT
    call_date_cst,
    unnest(coalesce(emotion_flags, array[]::text[])) AS emotion
  FROM public.v_trucking_calls_daily_cst
) t
GROUP BY call_date_cst, emotion;