-- Add missing columns to profiles that code references
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS my_page_ad_id text,
  ADD COLUMN IF NOT EXISTS advertiser_onboarding_completed boolean DEFAULT false;

-- Add missing columns to audio_ads that code references
ALTER TABLE public.audio_ads
  ADD COLUMN IF NOT EXISTS advertiser_id uuid REFERENCES public.advertisers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id uuid,
  ADD COLUMN IF NOT EXISTS ad_type text,
  ADD COLUMN IF NOT EXISTS voice_name text,
  ADD COLUMN IF NOT EXISTS phone_number text;

-- Add missing columns to advertisers
ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS business_description text;

-- Update app_settings to add missing columns
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS holiday_mode boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS holiday_snow boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_mode text DEFAULT 'live';