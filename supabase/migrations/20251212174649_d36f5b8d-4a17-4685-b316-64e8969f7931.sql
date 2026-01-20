-- Seeksy TV Advertising System
-- Tables for ad inventory, placements, and impressions

-- 1. Ad Inventory Table
CREATE TABLE public.seeksy_tv_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio')),
  asset_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  click_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  notes TEXT
);

-- 2. Ad Placements Table
CREATE TABLE public.seeksy_tv_ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ad_id UUID NOT NULL REFERENCES public.seeksy_tv_ads(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('channel', 'video')),
  channel_id UUID REFERENCES public.tv_channels(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.tv_content(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('pre', 'post', 'both')),
  cpm NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  priority INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT valid_target CHECK (
    (target_type = 'channel' AND channel_id IS NOT NULL AND video_id IS NULL) OR
    (target_type = 'video' AND video_id IS NOT NULL AND channel_id IS NULL)
  )
);

-- 3. Ad Impressions Table (Analytics)
CREATE TABLE public.seeksy_tv_ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ad_id UUID NOT NULL REFERENCES public.seeksy_tv_ads(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES public.seeksy_tv_ad_placements(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.tv_content(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.tv_channels(id) ON DELETE SET NULL,
  position TEXT NOT NULL CHECK (position IN ('pre', 'post')),
  viewer_session_id TEXT,
  ip_hash TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_seeksy_tv_ads_status ON public.seeksy_tv_ads(status);
CREATE INDEX idx_seeksy_tv_ads_type ON public.seeksy_tv_ads(type);
CREATE INDEX idx_seeksy_tv_ad_placements_ad_id ON public.seeksy_tv_ad_placements(ad_id);
CREATE INDEX idx_seeksy_tv_ad_placements_channel_id ON public.seeksy_tv_ad_placements(channel_id);
CREATE INDEX idx_seeksy_tv_ad_placements_video_id ON public.seeksy_tv_ad_placements(video_id);
CREATE INDEX idx_seeksy_tv_ad_placements_dates ON public.seeksy_tv_ad_placements(start_date, end_date);
CREATE INDEX idx_seeksy_tv_ad_placements_status ON public.seeksy_tv_ad_placements(status);
CREATE INDEX idx_seeksy_tv_ad_impressions_ad_id ON public.seeksy_tv_ad_impressions(ad_id);
CREATE INDEX idx_seeksy_tv_ad_impressions_placement_id ON public.seeksy_tv_ad_impressions(placement_id);
CREATE INDEX idx_seeksy_tv_ad_impressions_created_at ON public.seeksy_tv_ad_impressions(created_at);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_seeksy_tv_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_seeksy_tv_ads_timestamp
  BEFORE UPDATE ON public.seeksy_tv_ads
  FOR EACH ROW EXECUTE FUNCTION update_seeksy_tv_ads_updated_at();

CREATE TRIGGER update_seeksy_tv_ad_placements_timestamp
  BEFORE UPDATE ON public.seeksy_tv_ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_seeksy_tv_ads_updated_at();

-- Enable RLS
ALTER TABLE public.seeksy_tv_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeksy_tv_ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeksy_tv_ad_impressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seeksy_tv_ads
-- Only super_admin, admin, ad_manager can manage ads
CREATE POLICY "Ad managers can view ads"
  ON public.seeksy_tv_ads FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can create ads"
  ON public.seeksy_tv_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can update ads"
  ON public.seeksy_tv_ads FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can delete ads"
  ON public.seeksy_tv_ads FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

-- RLS Policies for seeksy_tv_ad_placements
CREATE POLICY "Ad managers can view placements"
  ON public.seeksy_tv_ad_placements FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can create placements"
  ON public.seeksy_tv_ad_placements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can update placements"
  ON public.seeksy_tv_ad_placements FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

CREATE POLICY "Ad managers can delete placements"
  ON public.seeksy_tv_ad_placements FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

-- RLS Policies for seeksy_tv_ad_impressions
-- View-only for ad managers, insert via service role only
CREATE POLICY "Ad managers can view impressions"
  ON public.seeksy_tv_ad_impressions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'ad_manager')
  );

-- Only super_admin can delete impressions (cleanup)
CREATE POLICY "Super admin can delete impressions"
  ON public.seeksy_tv_ad_impressions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));