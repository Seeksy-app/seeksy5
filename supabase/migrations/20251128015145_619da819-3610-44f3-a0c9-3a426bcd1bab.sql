-- Financial tracking tables for monetization ecosystem

-- Revenue events table: tracks all revenue-generating events
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'ad_read', 'impression', 'sponsorship', 'tip'
  revenue_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee DECIMAL(10, 2),
  creator_payout DECIMAL(10, 2),
  metadata JSONB, -- stores event-specific data
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Ad revenue events: tracks advertiser spending and ad delivery
CREATE TABLE IF NOT EXISTS public.ad_revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL,
  campaign_id TEXT NOT NULL,
  script_id TEXT NOT NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'script_created', 'script_approved', 'ad_marked', 'ad_read_complete'
  cpm_rate DECIMAL(10, 2),
  impressions INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10, 2),
  ad_read_timestamp INTEGER, -- seconds into episode
  ad_read_duration INTEGER, -- seconds
  is_certified_voice BOOLEAN DEFAULT false,
  voice_uplift_applied BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Creator payouts: tracks pending and completed payouts
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_revenue DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  payout_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payment_method TEXT,
  payment_reference TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CPM tiers: configurable CPM rates by ad type and certification
CREATE TABLE IF NOT EXISTS public.cpm_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  ad_type TEXT NOT NULL, -- 'host_read', 'announcer', 'dynamic_insertion'
  base_cpm DECIMAL(10, 2) NOT NULL,
  certified_voice_multiplier DECIMAL(4, 2) DEFAULT 1.25,
  min_impressions INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue forecasts: financial projections for CFO dashboard
CREATE TABLE IF NOT EXISTS public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  projected_revenue DECIMAL(10, 2) NOT NULL,
  projected_impressions INTEGER,
  projected_ad_reads INTEGER,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_events_user_id ON public.revenue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_episode_id ON public.revenue_events(episode_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_created_at ON public.revenue_events(created_at);

CREATE INDEX IF NOT EXISTS idx_ad_revenue_events_creator_id ON public.ad_revenue_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_events_episode_id ON public.ad_revenue_events(episode_id);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_events_campaign_id ON public.ad_revenue_events(campaign_id);

CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_status ON public.creator_payouts(status);

-- RLS policies
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpm_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;

-- Creators can view their own revenue
CREATE POLICY "Users can view own revenue events" ON public.revenue_events
  FOR SELECT USING (auth.uid() = user_id);

-- Creators can view their own ad revenue
CREATE POLICY "Creators can view own ad revenue" ON public.ad_revenue_events
  FOR SELECT USING (auth.uid() = creator_id);

-- Creators can view their own payouts
CREATE POLICY "Creators can view own payouts" ON public.creator_payouts
  FOR SELECT USING (auth.uid() = creator_id);

-- Everyone can view active CPM tiers (public pricing)
CREATE POLICY "Anyone can view active CPM tiers" ON public.cpm_tiers
  FOR SELECT USING (is_active = true);

-- Only system can write to financial tables (via edge functions)
CREATE POLICY "System can insert revenue events" ON public.revenue_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert ad revenue events" ON public.ad_revenue_events
  FOR INSERT WITH CHECK (true);

-- Insert default CPM tiers
INSERT INTO public.cpm_tiers (tier_name, ad_type, base_cpm, certified_voice_multiplier, min_impressions)
VALUES 
  ('Host-Read Standard', 'host_read', 30.00, 1.25, 1000),
  ('Announcer Standard', 'announcer', 20.00, 1.00, 1000),
  ('Dynamic Insertion', 'dynamic_insertion', 15.00, 1.00, 500)
ON CONFLICT (tier_name) DO NOTHING;