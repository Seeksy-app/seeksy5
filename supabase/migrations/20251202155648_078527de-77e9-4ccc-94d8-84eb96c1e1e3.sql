-- Add niche_tags to social_media_profiles
ALTER TABLE public.social_media_profiles 
ADD COLUMN IF NOT EXISTS niche_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS email text;

-- Create creator_valuations table
CREATE TABLE IF NOT EXISTS public.creator_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.social_media_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'instagram',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_likes_per_post INTEGER NOT NULL DEFAULT 0,
  avg_comments_per_post INTEGER NOT NULL DEFAULT 0,
  est_reach_per_post INTEGER NOT NULL DEFAULT 0,
  reel_price_low NUMERIC(10,2) NOT NULL DEFAULT 0,
  reel_price_mid NUMERIC(10,2) NOT NULL DEFAULT 0,
  reel_price_high NUMERIC(10,2) NOT NULL DEFAULT 0,
  feed_post_price_low NUMERIC(10,2) NOT NULL DEFAULT 0,
  feed_post_price_mid NUMERIC(10,2) NOT NULL DEFAULT 0,
  feed_post_price_high NUMERIC(10,2) NOT NULL DEFAULT 0,
  story_price_low NUMERIC(10,2) NOT NULL DEFAULT 0,
  story_price_mid NUMERIC(10,2) NOT NULL DEFAULT 0,
  story_price_high NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  assumptions_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agency_discovery_profiles table
CREATE TABLE IF NOT EXISTS public.agency_discovery_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL DEFAULT 'instagram',
  username text NOT NULL,
  profile_picture_url text,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  niche_tags text[] DEFAULT '{}',
  location text,
  email text,
  estimated_value_per_post NUMERIC(10,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual_import',
  linked_profile_id UUID REFERENCES public.social_media_profiles(id) ON DELETE SET NULL,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_sync_logs table for error tracking
CREATE TABLE IF NOT EXISTS public.social_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.social_media_profiles(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  error_code text,
  error_message text,
  posts_synced INTEGER DEFAULT 0,
  comments_synced INTEGER DEFAULT 0,
  insights_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_creator_valuations_user_id ON public.creator_valuations(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_valuations_profile_id ON public.creator_valuations(profile_id);
CREATE INDEX IF NOT EXISTS idx_agency_discovery_followers ON public.agency_discovery_profiles(followers);
CREATE INDEX IF NOT EXISTS idx_agency_discovery_engagement ON public.agency_discovery_profiles(engagement_rate);
CREATE INDEX IF NOT EXISTS idx_agency_discovery_niche ON public.agency_discovery_profiles USING GIN(niche_tags);
CREATE INDEX IF NOT EXISTS idx_social_sync_logs_user ON public.social_sync_logs(user_id);

-- Enable RLS
ALTER TABLE public.creator_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_discovery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_valuations
CREATE POLICY "Users can view own valuations" ON public.creator_valuations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own valuations" ON public.creator_valuations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own valuations" ON public.creator_valuations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for agency_discovery_profiles (publicly readable for discovery)
CREATE POLICY "Anyone can view discovery profiles" ON public.agency_discovery_profiles
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage discovery profiles" ON public.agency_discovery_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for social_sync_logs
CREATE POLICY "Users can view own sync logs" ON public.social_sync_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON public.social_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);