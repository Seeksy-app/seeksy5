-- Add Marketing and SMS module fields to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS module_marketing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS module_sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_modules JSONB DEFAULT '["meetings"]'::jsonb;

COMMENT ON COLUMN public.user_preferences.module_marketing_enabled IS 'Whether Marketing module is enabled for the user';
COMMENT ON COLUMN public.user_preferences.module_sms_enabled IS 'Whether SMS module is enabled for the user';
COMMENT ON COLUMN public.user_preferences.pinned_modules IS 'Array of module keys that are pinned to the sidebar';