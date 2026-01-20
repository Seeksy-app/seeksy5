-- Add purpose column to social_media_profiles to differentiate connection types
ALTER TABLE public.social_media_profiles 
ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'analytics';

-- Create index for faster lookups by purpose
CREATE INDEX IF NOT EXISTS idx_social_media_profiles_purpose 
ON public.social_media_profiles(user_id, platform, purpose);

-- Allow multiple YouTube connections per user (one per purpose)
-- Drop the old unique constraint if it exists and create a new one
DROP INDEX IF EXISTS idx_social_media_profiles_user_platform;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_media_profiles_user_platform_purpose 
ON public.social_media_profiles(user_id, platform, purpose);