-- Create daily briefs table for storing generated competitive intelligence
CREATE TABLE public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('ceo', 'board', 'investor', 'creator')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  competitive_insights JSONB DEFAULT '[]'::jsonb,
  market_trends JSONB DEFAULT '[]'::jsonb,
  strategy_assessment JSONB DEFAULT '{}'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brief_date, audience_type)
);

-- Create competitor tracking table
CREATE TABLE public.competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'podcast_platform',
  tracking_enabled BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create competitor updates table for scraped content
CREATE TABLE public.competitor_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitor_profiles(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('news', 'product', 'pricing', 'partnership', 'funding', 'feature')),
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create brief subscriptions for email delivery
CREATE TABLE public.brief_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('ceo', 'board', 'investor', 'creator')),
  is_active BOOLEAN DEFAULT true,
  delivery_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, audience_type)
);

-- Enable RLS
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_briefs (admins can manage, authenticated can read)
CREATE POLICY "Admins can manage daily briefs" ON public.daily_briefs
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can read daily briefs" ON public.daily_briefs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for competitor_profiles (admins can manage, authenticated can read)
CREATE POLICY "Admins can manage competitor profiles" ON public.competitor_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can read competitor profiles" ON public.competitor_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for competitor_updates
CREATE POLICY "Admins can manage competitor updates" ON public.competitor_updates
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can read competitor updates" ON public.competitor_updates
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for brief_subscriptions (users manage their own)
CREATE POLICY "Users can manage their own subscriptions" ON public.brief_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.brief_subscriptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_daily_briefs_updated_at
  BEFORE UPDATE ON public.daily_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitor_profiles_updated_at
  BEFORE UPDATE ON public.competitor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brief_subscriptions_updated_at
  BEFORE UPDATE ON public.brief_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed competitor profiles
INSERT INTO public.competitor_profiles (name, website_url, description, category) VALUES
  ('Spotify for Podcasters', 'https://podcasters.spotify.com', 'Spotify podcast hosting and distribution platform', 'podcast_platform'),
  ('YouTube', 'https://www.youtube.com', 'Video and podcast hosting platform', 'video_platform'),
  ('Riverside.fm', 'https://riverside.fm', 'Remote podcast and video recording studio', 'recording_studio'),
  ('Restream', 'https://restream.io', 'Live streaming and podcast distribution', 'streaming_platform'),
  ('Podmatch', 'https://podmatch.com', 'Podcast guest matching platform', 'podcast_network'),
  ('Buzzsprout', 'https://buzzsprout.com', 'Podcast hosting and analytics', 'podcast_platform'),
  ('Anchor', 'https://anchor.fm', 'Free podcast hosting by Spotify', 'podcast_platform'),
  ('Descript', 'https://descript.com', 'AI-powered audio and video editing', 'editing_tool');

-- Create indexes for performance
CREATE INDEX idx_daily_briefs_date_audience ON public.daily_briefs(brief_date, audience_type);
CREATE INDEX idx_competitor_updates_competitor ON public.competitor_updates(competitor_id, scraped_at DESC);
CREATE INDEX idx_brief_subscriptions_user ON public.brief_subscriptions(user_id, is_active);