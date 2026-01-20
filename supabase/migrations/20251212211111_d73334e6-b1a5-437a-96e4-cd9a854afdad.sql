-- Add click_url column to seeksy_tv_ads if not exists (already exists based on code)
-- Verify and continue with new tables

-- Table: seeksy_tv_ad_clicks (for click tracking)
CREATE TABLE IF NOT EXISTS public.seeksy_tv_ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ad_id UUID NOT NULL REFERENCES public.seeksy_tv_ads(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES public.seeksy_tv_ad_placements(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.tv_content(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.tv_channels(id) ON DELETE SET NULL,
  position TEXT CHECK (position IN ('pre', 'mid', 'post')),
  viewer_session_id TEXT,
  ip_hash TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  destination_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT
);

-- Indexes for click tracking
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_clicks_ad_created ON public.seeksy_tv_ad_clicks(ad_id, created_at);
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_clicks_placement_created ON public.seeksy_tv_ad_clicks(placement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_clicks_session ON public.seeksy_tv_ad_clicks(viewer_session_id);

-- Table: seeksy_tv_ad_events (for quartile/completion tracking)
CREATE TABLE IF NOT EXISTS public.seeksy_tv_ad_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ad_id UUID NOT NULL REFERENCES public.seeksy_tv_ads(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES public.seeksy_tv_ad_placements(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.tv_content(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.tv_channels(id) ON DELETE SET NULL,
  position TEXT NOT NULL CHECK (position IN ('pre', 'mid', 'post')),
  event_type TEXT NOT NULL CHECK (event_type IN ('start', 'first_quartile', 'midpoint', 'third_quartile', 'complete', 'skip', 'error')),
  at_second NUMERIC,
  duration_seconds NUMERIC,
  viewer_session_id TEXT,
  ip_hash TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_code TEXT
);

-- Indexes for event tracking
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_events_placement_created ON public.seeksy_tv_ad_events(placement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_events_ad_type_created ON public.seeksy_tv_ad_events(ad_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_seeksy_tv_ad_events_session ON public.seeksy_tv_ad_events(viewer_session_id);

-- RLS policies for seeksy_tv_ad_clicks (service role insert, admin read)
ALTER TABLE public.seeksy_tv_ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert on seeksy_tv_ad_clicks"
ON public.seeksy_tv_ad_clicks
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow admin read on seeksy_tv_ad_clicks"
ON public.seeksy_tv_ad_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'ad_manager')
  )
);

-- RLS policies for seeksy_tv_ad_events (service role insert, admin read)
ALTER TABLE public.seeksy_tv_ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role insert on seeksy_tv_ad_events"
ON public.seeksy_tv_ad_events
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow admin read on seeksy_tv_ad_events"
ON public.seeksy_tv_ad_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'ad_manager')
  )
);