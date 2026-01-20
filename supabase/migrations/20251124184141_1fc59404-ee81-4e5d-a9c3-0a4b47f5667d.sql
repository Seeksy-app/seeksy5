-- Add onboarding and integration tracking to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS my_page_enabled BOOLEAN DEFAULT TRUE; -- Default true for existing users

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding ON public.user_preferences(user_id, onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_preferences_my_page ON public.user_preferences(user_id, my_page_enabled);