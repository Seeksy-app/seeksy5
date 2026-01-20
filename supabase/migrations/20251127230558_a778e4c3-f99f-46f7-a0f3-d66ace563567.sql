-- Voice Social Media Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.voice_social_media_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID NOT NULL REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  platform TEXT NOT NULL, -- youtube, spotify, tiktok, instagram, twitter
  content_url TEXT,
  content_title TEXT,
  content_description TEXT,
  thumbnail_url TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confidence_score DECIMAL(5,2), -- 0-100%
  is_authorized BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  engagement_metrics JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice Badge Shares Table (track when/where badges are shared)
CREATE TABLE IF NOT EXISTS public.voice_badge_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID NOT NULL REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  share_type TEXT NOT NULL, -- embed, link, qr_code, download
  platform TEXT, -- where it was shared
  shared_url TEXT,
  view_count INTEGER DEFAULT 0,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_social_media_usage_creator ON public.voice_social_media_usage(creator_id);
CREATE INDEX IF NOT EXISTS idx_voice_social_media_usage_profile ON public.voice_social_media_usage(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_social_media_usage_platform ON public.voice_social_media_usage(platform);
CREATE INDEX IF NOT EXISTS idx_voice_badge_shares_creator ON public.voice_badge_shares(creator_id);
CREATE INDEX IF NOT EXISTS idx_voice_badge_shares_profile ON public.voice_badge_shares(voice_profile_id);

-- Enable RLS
ALTER TABLE public.voice_social_media_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_badge_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_social_media_usage
CREATE POLICY "Users can view their own voice usage"
  ON public.voice_social_media_usage
  FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert voice usage detections"
  ON public.voice_social_media_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own voice usage"
  ON public.voice_social_media_usage
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies for voice_badge_shares
CREATE POLICY "Users can view their own badge shares"
  ON public.voice_badge_shares
  FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create badge shares"
  ON public.voice_badge_shares
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own badge shares"
  ON public.voice_badge_shares
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Update timestamp triggers
CREATE TRIGGER update_voice_social_media_usage_updated_at
  BEFORE UPDATE ON public.voice_social_media_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_badge_shares_updated_at
  BEFORE UPDATE ON public.voice_badge_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();