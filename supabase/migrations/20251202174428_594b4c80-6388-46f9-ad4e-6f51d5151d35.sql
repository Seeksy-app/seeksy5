-- Add refresh_token column to social_media_profiles for YouTube/Meta OAuth
ALTER TABLE public.social_media_profiles 
ADD COLUMN IF NOT EXISTS refresh_token TEXT;