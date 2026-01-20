-- Add admin-specific navigation config column
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS admin_nav_config jsonb DEFAULT NULL;