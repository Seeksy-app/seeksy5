-- Add navigation customization columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS nav_config JSONB DEFAULT '{
  "order": ["my_day", "dashboard", "creator_hub", "meetings", "studio", "podcasts", "brand_campaigns", "revenue_tracking", "content_library", "social_analytics", "settings"],
  "hidden": [],
  "pinned": ["my_day", "dashboard", "creator_hub"]
}'::jsonb,
ADD COLUMN IF NOT EXISTS default_landing_route TEXT DEFAULT '/my-day';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_default_landing ON public.user_preferences(default_landing_route);