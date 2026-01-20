-- Seed comprehensive advertising and market benchmarks into rd_benchmarks
-- Using existing schema: metric_key, value, unit, time_window, source_notes, confidence

INSERT INTO rd_benchmarks (metric_key, value, unit, time_window, source_notes, confidence) VALUES
-- Audio CPM Benchmarks - Host-read
('audio_hostread_preroll_cpm_low', 18, 'USD', '2025', 'Host-read pre-roll CPM floor', 'high'),
('audio_hostread_preroll_cpm_high', 25, 'USD', '2025', 'Host-read pre-roll CPM ceiling', 'high'),
('audio_hostread_midroll_cpm_low', 22, 'USD', '2025', 'Host-read mid-roll CPM floor', 'high'),
('audio_hostread_midroll_cpm_high', 30, 'USD', '2025', 'Host-read mid-roll CPM ceiling', 'high'),
('audio_hostread_postroll_cpm_low', 12, 'USD', '2025', 'Host-read post-roll CPM floor', 'medium'),
('audio_hostread_postroll_cpm_high', 18, 'USD', '2025', 'Host-read post-roll CPM ceiling', 'medium'),
-- Programmatic audio
('audio_programmatic_cpm_low', 8, 'USD', '2025', 'Programmatic audio CPM floor', 'medium'),
('audio_programmatic_cpm_high', 15, 'USD', '2025', 'Programmatic audio CPM ceiling', 'medium'),

-- Video CPM Benchmarks
('video_preroll_cpm_low', 12, 'USD', '2025', 'Video pre-roll CPM floor', 'medium'),
('video_preroll_cpm_high', 22, 'USD', '2025', 'Video pre-roll CPM ceiling', 'medium'),
('video_midroll_cpm_low', 15, 'USD', '2025', 'Video mid-roll CPM floor', 'medium'),
('video_midroll_cpm_high', 28, 'USD', '2025', 'Video mid-roll CPM ceiling', 'medium'),

-- Newsletter and Display
('newsletter_cpm_avg', 35, 'USD', '2025', 'Newsletter/email average CPM', 'medium'),
('display_cpm_avg', 5, 'USD', '2025', 'Display ad average CPM', 'medium'),

-- Livestream / Seeksy TV
('livestream_cpm_blended', 18, 'USD', '2025', 'Seeksy TV blended CPM', 'low'),
('livestream_sponsorship_per_event_low', 500, 'USD', '2025', 'Livestream sponsorship floor', 'low'),
('livestream_sponsorship_per_event_high', 5000, 'USD', '2025', 'Livestream sponsorship ceiling', 'low'),

-- Brand Deal Flat Fees
('brand_deal_flat_fee_low', 250, 'USD', '2025', 'Brand deal flat fee minimum', 'low'),
('brand_deal_flat_fee_high', 10000, 'USD', '2025', 'Brand deal flat fee maximum', 'low'),

-- Monthly Impressions - Podcasters
('podcaster_small_monthly_impressions_low', 500, 'impressions', '2025', 'Small podcaster downloads floor', 'medium'),
('podcaster_small_monthly_impressions_high', 5000, 'impressions', '2025', 'Small podcaster downloads ceiling', 'medium'),
('podcaster_mid_monthly_impressions_low', 5000, 'impressions', '2025', 'Mid podcaster downloads floor', 'medium'),
('podcaster_mid_monthly_impressions_high', 50000, 'impressions', '2025', 'Mid podcaster downloads ceiling', 'medium'),
('podcaster_large_monthly_impressions_low', 50000, 'impressions', '2025', 'Large podcaster downloads floor', 'medium'),
('podcaster_large_monthly_impressions_high', 500000, 'impressions', '2025', 'Large podcaster downloads ceiling', 'medium'),

-- Monthly Impressions - Video Creators
('video_creator_small_monthly_views_low', 1000, 'views', '2025', 'Small video creator views floor', 'medium'),
('video_creator_small_monthly_views_high', 10000, 'views', '2025', 'Small video creator views ceiling', 'medium'),
('video_creator_mid_monthly_views_low', 10000, 'views', '2025', 'Mid video creator views floor', 'medium'),
('video_creator_mid_monthly_views_high', 100000, 'views', '2025', 'Mid video creator views ceiling', 'medium'),
('video_creator_large_monthly_views_low', 100000, 'views', '2025', 'Large video creator views floor', 'low'),
('video_creator_large_monthly_views_high', 1000000, 'views', '2025', 'Large video creator views ceiling', 'low'),

-- Livestream Impressions
('livestream_avg_viewers_per_event', 150, 'viewers', '2025', 'Avg concurrent viewers per event', 'low'),
('livestream_impressions_per_event', 500, 'impressions', '2025', 'Total impressions per event', 'low'),

-- Fill Rates
('audio_fill_rate', 65, 'percent', '2025', 'Audio ad fill rate', 'medium'),
('video_fill_rate', 55, 'percent', '2025', 'Video ad fill rate', 'medium'),
('newsletter_fill_rate', 80, 'percent', '2025', 'Newsletter ad fill rate', 'medium'),
('display_fill_rate', 70, 'percent', '2025', 'Display ad fill rate', 'medium'),
('livestream_fill_rate', 45, 'percent', '2025', 'Livestream ad fill rate', 'low'),

-- Ad Load
('audio_ad_slots_per_episode', 3, 'slots', '2025', 'Avg ad slots per podcast episode', 'high'),
('video_ad_slots_per_video', 2, 'slots', '2025', 'Avg ad slots per video', 'medium'),
('livestream_ad_slots_per_hour', 4, 'slots', '2025', 'Avg ad slots per hour livestream', 'low'),

-- Revenue Shares
('hostread_creator_share', 70, 'percent', '2025', 'Host-read creator revenue share', 'high'),
('hostread_platform_share', 30, 'percent', '2025', 'Host-read platform revenue share', 'high'),
('programmatic_creator_share', 60, 'percent', '2025', 'Programmatic creator revenue share', 'high'),
('programmatic_platform_share', 40, 'percent', '2025', 'Programmatic platform revenue share', 'high'),
('brand_deal_creator_share', 80, 'percent', '2025', 'Brand deal creator revenue share', 'medium'),
('brand_deal_platform_share', 20, 'percent', '2025', 'Brand deal platform revenue share', 'medium'),
('livestream_creator_share', 65, 'percent', '2025', 'Livestream creator revenue share', 'medium'),
('livestream_platform_share', 35, 'percent', '2025', 'Livestream platform revenue share', 'medium'),
('newsletter_creator_share', 75, 'percent', '2025', 'Newsletter creator revenue share', 'medium'),
('newsletter_platform_share', 25, 'percent', '2025', 'Newsletter platform revenue share', 'medium'),

-- Growth Rates
('podcast_ad_cagr', 15, 'percent', '2025', 'Podcast ad market CAGR', 'medium'),
('video_ad_cagr', 12, 'percent', '2025', 'Video ad market CAGR', 'medium'),
('creator_brand_deal_cagr', 18, 'percent', '2025', 'Creator brand deal CAGR', 'medium'),
('livestream_ad_cagr', 22, 'percent', '2025', 'Livestream ad market CAGR', 'low'),

-- Market Size
('creator_tam_2025', 250000000000, 'USD', '2025', 'Creator economy TAM 2025', 'medium'),
('creator_tam_2027', 480000000000, 'USD', '2027', 'Creator economy TAM 2027', 'low'),
('podcast_ad_spend_tam_2025', 4000000000, 'USD', '2025', 'Podcast ad spend TAM', 'medium'),

-- Subscription ARPU
('creator_subscription_arpu_free', 0, 'USD', '2025', 'Free tier ARPU', 'high'),
('creator_subscription_arpu_pro', 29, 'USD', '2025', 'Pro tier monthly ARPU', 'high'),
('creator_subscription_arpu_business', 79, 'USD', '2025', 'Business tier monthly ARPU', 'high'),
('creator_subscription_arpu_enterprise', 299, 'USD', '2025', 'Enterprise tier monthly ARPU', 'high'),

-- Events & Awards
('avg_event_ticket_price', 45, 'USD', '2025', 'Average event ticket price', 'low'),
('avg_award_sponsorship_value', 2500, 'USD', '2025', 'Average award sponsorship value', 'low'),

-- Unit Economics
('creator_cac_organic', 15, 'USD', '2025', 'Creator CAC organic', 'low'),
('creator_cac_paid', 45, 'USD', '2025', 'Creator CAC paid', 'low'),
('creator_monthly_churn', 5, 'percent', '2025', 'Creator monthly churn rate', 'low'),
('advertiser_monthly_churn', 8, 'percent', '2025', 'Advertiser monthly churn rate', 'low')

ON CONFLICT (metric_key) DO UPDATE SET 
  value = EXCLUDED.value,
  unit = EXCLUDED.unit,
  time_window = EXCLUDED.time_window,
  source_notes = EXCLUDED.source_notes,
  confidence = EXCLUDED.confidence,
  last_updated_at = NOW();