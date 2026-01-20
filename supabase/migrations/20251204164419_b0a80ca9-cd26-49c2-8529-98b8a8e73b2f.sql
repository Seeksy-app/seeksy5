-- Add onboarding progress column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS onboarding_progress jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_preferences.onboarding_progress IS 'Tracks per-page onboarding completion status';