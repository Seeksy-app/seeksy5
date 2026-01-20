-- Add avatar_url column to app_audio_descriptions table
ALTER TABLE public.app_audio_descriptions
ADD COLUMN avatar_url TEXT;

COMMENT ON COLUMN public.app_audio_descriptions.avatar_url IS 'URL of the AI-generated avatar image for this app';