/* =========================================================
   SEEKSY TV ADS — ANALYTICS VIEWS
   - Safe dedupe using a "play_key" per ad play instance
   - Works for dashboards + CSV export
   ========================================================= */

/* 1) PLAY KEY NORMALIZATION (events) */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_events_norm AS
SELECT
  e.*,
  concat_ws(
    '|',
    e.placement_id::text,
    e.video_id::text,
    coalesce(nullif(e.viewer_session_id, ''), e.ip_hash, 'na')
  ) AS play_key
FROM seeksy_tv_ad_events e;

/* 2) DEDUPED EVENT COUNTS BY PLACEMENT */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_event_rollup_by_placement AS
SELECT
  placement_id,
  ad_id,
  channel_id,
  video_id,
  count(DISTINCT CASE WHEN event_type = 'start' THEN play_key END) AS starts,
  count(DISTINCT CASE WHEN event_type = 'complete' THEN play_key END) AS completes,
  count(DISTINCT CASE WHEN event_type = 'skip' THEN play_key END) AS skips,
  count(DISTINCT CASE WHEN event_type = 'error' THEN play_key END) AS errors,
  count(DISTINCT CASE WHEN event_type = 'first_quartile' THEN play_key END) AS q25,
  count(DISTINCT CASE WHEN event_type = 'midpoint' THEN play_key END) AS q50,
  count(DISTINCT CASE WHEN event_type = 'third_quartile' THEN play_key END) AS q75
FROM v_seeksy_tv_ad_events_norm
GROUP BY placement_id, ad_id, channel_id, video_id;

/* 3) IMPRESSIONS BY PLACEMENT */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_impressions_by_placement AS
SELECT
  placement_id,
  ad_id,
  channel_id,
  video_id,
  count(*) AS impressions
FROM seeksy_tv_ad_impressions
GROUP BY placement_id, ad_id, channel_id, video_id;

/* 4) CLICKS BY PLACEMENT */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_clicks_by_placement AS
SELECT
  placement_id,
  ad_id,
  channel_id,
  video_id,
  count(*) AS clicks
FROM seeksy_tv_ad_clicks
GROUP BY placement_id, ad_id, channel_id, video_id;

/* 5) MASTER PLACEMENT METRICS VIEW */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_metrics_by_placement AS
WITH base AS (
  SELECT
    coalesce(i.placement_id, e.placement_id, c.placement_id) AS placement_id,
    coalesce(i.ad_id, e.ad_id, c.ad_id) AS ad_id,
    coalesce(i.channel_id, e.channel_id, c.channel_id) AS channel_id,
    coalesce(i.video_id, e.video_id, c.video_id) AS video_id,
    coalesce(i.impressions, 0) AS impressions,
    coalesce(c.clicks, 0) AS clicks,
    coalesce(e.starts, 0) AS starts,
    coalesce(e.completes, 0) AS completes,
    coalesce(e.skips, 0) AS skips,
    coalesce(e.errors, 0) AS errors,
    coalesce(e.q25, 0) AS q25,
    coalesce(e.q50, 0) AS q50,
    coalesce(e.q75, 0) AS q75
  FROM v_seeksy_tv_ad_impressions_by_placement i
  FULL OUTER JOIN v_seeksy_tv_ad_event_rollup_by_placement e
    ON e.placement_id = i.placement_id
   AND e.ad_id = i.ad_id
   AND e.channel_id = i.channel_id
   AND e.video_id = i.video_id
  FULL OUTER JOIN v_seeksy_tv_ad_clicks_by_placement c
    ON c.placement_id = coalesce(i.placement_id, e.placement_id)
   AND c.ad_id = coalesce(i.ad_id, e.ad_id)
   AND c.channel_id = coalesce(i.channel_id, e.channel_id)
   AND c.video_id = coalesce(i.video_id, e.video_id)
)
SELECT
  b.*,
  p.cpm,
  (b.clicks::numeric / nullif(b.impressions, 0)) AS ctr,
  (b.completes::numeric / nullif(b.starts, 0)) AS completion_rate,
  (b.skips::numeric / nullif(b.starts, 0)) AS skip_rate,
  (b.errors::numeric / nullif(b.starts, 0)) AS error_rate,
  ((b.impressions::numeric / 1000.0) * coalesce(p.cpm, 0)) AS spend
FROM base b
LEFT JOIN seeksy_tv_ad_placements p ON p.id = b.placement_id;

/* 6) SUMMARY KPI VIEW */
CREATE OR REPLACE VIEW v_seeksy_tv_ad_kpis AS
SELECT
  sum(impressions) AS impressions,
  sum(clicks) AS clicks,
  (sum(clicks)::numeric / nullif(sum(impressions), 0)) AS ctr,
  sum(starts) AS starts,
  sum(completes) AS completes,
  (sum(completes)::numeric / nullif(sum(starts), 0)) AS completion_rate,
  sum(skips) AS skips,
  (sum(skips)::numeric / nullif(sum(starts), 0)) AS skip_rate,
  sum(errors) AS errors,
  (sum(errors)::numeric / nullif(sum(starts), 0)) AS error_rate,
  sum(spend) AS spend,
  sum(q25) AS q25,
  sum(q50) AS q50,
  sum(q75) AS q75
FROM v_seeksy_tv_ad_metrics_by_placement;