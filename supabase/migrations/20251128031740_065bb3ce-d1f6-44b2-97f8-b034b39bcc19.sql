-- External Platform Ad Stats table
CREATE TABLE IF NOT EXISTS public.external_platform_ad_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Platform identification
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'apple_podcasts', 'other')),
  source_type TEXT NOT NULL CHECK (source_type IN ('spotify_campaign', 'apple_campaign', 'youtube_campaign', 'other')),
  
  -- Internal references (nullable)
  ad_campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  ad_creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  video_id TEXT,
  
  -- External platform identifiers
  external_content_id TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  views_or_listens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  completed_plays INTEGER DEFAULT 0,
  watch_time_ms BIGINT DEFAULT 0,
  listen_time_ms BIGINT DEFAULT 0,
  estimated_revenue DECIMAL(10,2),
  
  -- Raw data for auditing
  raw_payload JSONB,
  
  -- Constraints
  UNIQUE(platform, external_content_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_platform_ad_stats_platform_date 
  ON public.external_platform_ad_stats(platform, date);
CREATE INDEX IF NOT EXISTS idx_external_platform_ad_stats_campaign_date 
  ON public.external_platform_ad_stats(ad_campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_external_platform_ad_stats_episode_date 
  ON public.external_platform_ad_stats(episode_id, date);
CREATE INDEX IF NOT EXISTS idx_external_platform_ad_stats_external_id 
  ON public.external_platform_ad_stats(external_content_id);

-- RLS policies
ALTER TABLE public.external_platform_ad_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all external platform stats"
  ON public.external_platform_ad_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert external platform stats"
  ON public.external_platform_ad_stats
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update external platform stats"
  ON public.external_platform_ad_stats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- External Content Mapping table
CREATE TABLE IF NOT EXISTS public.external_content_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'apple_podcasts', 'other')),
  external_content_id TEXT NOT NULL,
  
  -- Internal references
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  video_id TEXT,
  ad_campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  
  UNIQUE(platform, external_content_id)
);

CREATE INDEX IF NOT EXISTS idx_external_content_mapping_platform 
  ON public.external_content_mapping(platform, external_content_id);

-- RLS for external content mapping
ALTER TABLE public.external_content_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage external content mapping"
  ON public.external_content_mapping
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- External Platform Accounts (for OAuth tokens)
CREATE TABLE IF NOT EXISTS public.external_platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'apple_podcasts', 'other')),
  account_name TEXT,
  
  -- OAuth credentials (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account metadata
  external_account_id TEXT,
  account_metadata JSONB,
  
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(platform, external_account_id)
);

-- RLS for external platform accounts
ALTER TABLE public.external_platform_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage external platform accounts"
  ON public.external_platform_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_external_platform_ad_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_platform_ad_stats_updated_at
  BEFORE UPDATE ON public.external_platform_ad_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_external_platform_ad_stats_updated_at();