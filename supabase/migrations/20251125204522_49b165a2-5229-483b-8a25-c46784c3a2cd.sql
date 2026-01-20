-- Create creator voice profiles table
CREATE TABLE IF NOT EXISTS public.creator_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  voice_name TEXT NOT NULL,
  elevenlabs_voice_id TEXT,
  sample_audio_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_available_for_ads BOOLEAN DEFAULT false,
  price_per_ad DECIMAL(10,2),
  usage_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_voice_profiles ENABLE ROW LEVEL SECURITY;

-- Creators can view and manage their own voice profiles
CREATE POLICY "Users can view their own voice profiles"
  ON public.creator_voice_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice profiles"
  ON public.creator_voice_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profiles"
  ON public.creator_voice_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Advertisers can view available voices for ads
CREATE POLICY "Advertisers can view available voices"
  ON public.creator_voice_profiles FOR SELECT
  USING (is_available_for_ads = true AND is_verified = true);

-- Create voice usage tracking table
CREATE TABLE IF NOT EXISTS public.voice_ad_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  audio_ad_id UUID REFERENCES public.audio_ads(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES public.advertisers(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.voice_ad_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voice owners can view their usage"
  ON public.voice_ad_usage FOR SELECT
  USING (
    voice_profile_id IN (
      SELECT id FROM public.creator_voice_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can view their usage"
  ON public.voice_ad_usage FOR SELECT
  USING (
    advertiser_id IN (
      SELECT id FROM public.advertisers WHERE user_id = auth.uid()
    )
  );

-- Add verified voice badge field to audio_ads
ALTER TABLE public.audio_ads 
ADD COLUMN IF NOT EXISTS uses_creator_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_voice_profile_id UUID REFERENCES public.creator_voice_profiles(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user ON public.creator_voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_available ON public.creator_voice_profiles(is_available_for_ads, is_verified);
CREATE INDEX IF NOT EXISTS idx_voice_usage_profile ON public.voice_ad_usage(voice_profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_usage_advertiser ON public.voice_ad_usage(advertiser_id);