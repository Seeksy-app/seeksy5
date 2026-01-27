-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Profiles table missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS my_page_cta_button_text text,
ADD COLUMN IF NOT EXISTS my_page_cta_phone_number text,
ADD COLUMN IF NOT EXISTS my_page_cta_text_keyword text;

-- Email folders missing color column
ALTER TABLE public.email_folders
ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1';

-- Audio ads missing columns
ALTER TABLE public.audio_ads
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text,
ADD COLUMN IF NOT EXISTS conversation_config jsonb,
ADD COLUMN IF NOT EXISTS phone_number_type text,
ADD COLUMN IF NOT EXISTS voice_id text;

-- Advertisers missing columns
ALTER TABLE public.advertisers
ADD COLUMN IF NOT EXISTS owner_profile_id uuid;

-- User credits missing columns
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance numeric DEFAULT 0,
  total_purchased numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  total_earned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all credits" ON public.user_credits FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- CREATE MISSING TABLES
-- =============================================

-- Podcasts table
CREATE TABLE IF NOT EXISTS public.podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  cover_image_url text,
  rss_feed_url text,
  category text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own podcasts" ON public.podcasts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view published podcasts" ON public.podcasts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all podcasts" ON public.podcasts FOR SELECT USING (is_admin(auth.uid()));

-- Episodes table
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  audio_url text,
  duration_seconds numeric,
  publish_date timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own episodes" ON public.episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.podcasts WHERE id = episodes.podcast_id AND user_id = auth.uid())
);
CREATE POLICY "Public can view published episodes" ON public.episodes FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all episodes" ON public.episodes FOR SELECT USING (is_admin(auth.uid()));

-- Ad Campaigns table
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  total_budget numeric DEFAULT 0,
  cpm_bid numeric DEFAULT 0,
  total_impressions integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  targeting jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns" ON public.ad_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.advertisers WHERE id = ad_campaigns.advertiser_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all campaigns" ON public.ad_campaigns FOR ALL USING (is_admin(auth.uid()));

-- Ad Creatives table
CREATE TABLE IF NOT EXISTS public.ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  audio_ad_id uuid REFERENCES public.audio_ads(id) ON DELETE SET NULL,
  name text,
  status text DEFAULT 'draft',
  creative_type text DEFAULT 'audio',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own creatives" ON public.ad_creatives FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.ad_campaigns ac 
    JOIN public.advertisers a ON a.id = ac.advertiser_id 
    WHERE ac.id = ad_creatives.campaign_id AND a.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all creatives" ON public.ad_creatives FOR ALL USING (is_admin(auth.uid()));

-- Ad Slots table
CREATE TABLE IF NOT EXISTS public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES public.episodes(id) ON DELETE CASCADE,
  podcast_id uuid REFERENCES public.podcasts(id) ON DELETE CASCADE,
  slot_type text NOT NULL, -- 'pre', 'mid', 'post'
  position_seconds numeric,
  manual_audio_url text,
  assigned_campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  status text DEFAULT 'open', -- 'open', 'filled', 'disabled'
  cta_url text,
  cta_text text,
  start_time numeric,
  end_time numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ad slots" ON public.ad_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.podcasts WHERE id = ad_slots.podcast_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all ad slots" ON public.ad_slots FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Public can view filled ad slots" ON public.ad_slots FOR SELECT USING (status = 'filled');

-- Ad Impressions table
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id uuid REFERENCES public.ad_slots(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE SET NULL,
  episode_id uuid,
  podcast_id uuid,
  creator_id uuid,
  listener_id uuid,
  impression_type text DEFAULT 'play',
  duration_listened numeric,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all impressions" ON public.ad_impressions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage all impressions" ON public.ad_impressions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Creators can view own impressions" ON public.ad_impressions FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Anyone can insert impressions" ON public.ad_impressions FOR INSERT WITH CHECK (true);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text DEFAULT 'free',
  status text DEFAULT 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions FOR ALL USING (is_admin(auth.uid()));

-- App Audio Descriptions table
CREATE TABLE IF NOT EXISTS public.app_audio_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text UNIQUE NOT NULL,
  app_name text NOT NULL,
  script text,
  audio_url text,
  avatar_url text,
  voice_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_audio_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app audio descriptions" ON public.app_audio_descriptions FOR SELECT USING (true);
CREATE POLICY "Admins can manage app audio descriptions" ON public.app_audio_descriptions FOR ALL USING (is_admin(auth.uid()));

-- Email Template Folders table
CREATE TABLE IF NOT EXISTS public.email_template_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_template_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders" ON public.email_template_folders FOR ALL USING (auth.uid() = user_id);

-- Saved Email Templates table
CREATE TABLE IF NOT EXISTS public.saved_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_id uuid REFERENCES public.email_template_folders(id) ON DELETE SET NULL,
  template_id text,
  name text NOT NULL,
  customized_html text,
  customization_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved templates" ON public.saved_email_templates FOR ALL USING (auth.uid() = user_id);

-- AI Edited Assets table
CREATE TABLE IF NOT EXISTS public.ai_edited_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.ai_jobs(id) ON DELETE CASCADE,
  output_type text,
  storage_path text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_edited_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.ai_edited_assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_jobs WHERE id = ai_edited_assets.job_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all assets" ON public.ai_edited_assets FOR SELECT USING (is_admin(auth.uid()));

-- AI Edit Events table
CREATE TABLE IF NOT EXISTS public.ai_edit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.ai_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  timestamp_seconds numeric,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_edit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edit events" ON public.ai_edit_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_jobs WHERE id = ai_edit_events.job_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all edit events" ON public.ai_edit_events FOR SELECT USING (is_admin(auth.uid()));

-- AI Jobs missing columns
ALTER TABLE public.ai_jobs
ADD COLUMN IF NOT EXISTS source_media_id uuid;

-- Add foreign key relationships for audio_ads
ALTER TABLE public.audio_ads
ADD COLUMN IF NOT EXISTS campaign_id uuid;

-- Create database function for usage tracking
CREATE OR REPLACE FUNCTION public.increment_usage(_user_id uuid, _feature_type text, _increment integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder function for usage tracking
  -- Implementation can be expanded based on requirements
  RETURN;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_slots_episode_id ON public.ad_slots(episode_id);
CREATE INDEX IF NOT EXISTS idx_ad_slots_podcast_id ON public.ad_slots(podcast_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign_id ON public.ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON public.episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser_id ON public.ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);