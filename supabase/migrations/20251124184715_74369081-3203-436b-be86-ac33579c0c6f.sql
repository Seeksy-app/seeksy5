-- Add advertiser module preference to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS module_advertiser_enabled BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_advertiser ON public.user_preferences(user_id, module_advertiser_enabled);