-- Create table for storing Meta (Facebook/Instagram) social data
CREATE TABLE IF NOT EXISTS public.meta_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  platform_user_id TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  profile_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Create table for storing post metrics
CREATE TABLE IF NOT EXISTS public.meta_post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.meta_integrations(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  post_url TEXT,
  post_type TEXT, -- photo, video, reel, story
  caption TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  media_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, post_id)
);

-- Create table for audience demographics
CREATE TABLE IF NOT EXISTS public.meta_audience_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.meta_integrations(id) ON DELETE CASCADE,
  age_range TEXT, -- 18-24, 25-34, etc
  gender TEXT, -- male, female, other
  country TEXT,
  city TEXT,
  percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_meta_integrations_user_id ON public.meta_integrations(user_id);
CREATE INDEX idx_meta_integrations_platform ON public.meta_integrations(platform);
CREATE INDEX idx_meta_post_metrics_integration_id ON public.meta_post_metrics(integration_id);
CREATE INDEX idx_meta_post_metrics_published_at ON public.meta_post_metrics(published_at DESC);
CREATE INDEX idx_meta_audience_demographics_integration_id ON public.meta_audience_demographics(integration_id);

-- Enable RLS
ALTER TABLE public.meta_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_audience_demographics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meta_integrations
CREATE POLICY "Users can view their own Meta integrations"
  ON public.meta_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Meta integrations"
  ON public.meta_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Meta integrations"
  ON public.meta_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Meta integrations"
  ON public.meta_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meta_post_metrics
CREATE POLICY "Users can view their own post metrics"
  ON public.meta_post_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meta_integrations
      WHERE meta_integrations.id = meta_post_metrics.integration_id
      AND meta_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own post metrics"
  ON public.meta_post_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meta_integrations
      WHERE meta_integrations.id = meta_post_metrics.integration_id
      AND meta_integrations.user_id = auth.uid()
    )
  );

-- RLS Policies for meta_audience_demographics
CREATE POLICY "Users can view their own audience demographics"
  ON public.meta_audience_demographics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meta_integrations
      WHERE meta_integrations.id = meta_audience_demographics.integration_id
      AND meta_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own audience demographics"
  ON public.meta_audience_demographics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meta_integrations
      WHERE meta_integrations.id = meta_audience_demographics.integration_id
      AND meta_integrations.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_meta_integrations_updated_at
  BEFORE UPDATE ON public.meta_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER update_meta_post_metrics_updated_at
  BEFORE UPDATE ON public.meta_post_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_updated_at();