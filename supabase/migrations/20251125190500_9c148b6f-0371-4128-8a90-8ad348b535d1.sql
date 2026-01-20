-- Add module_lead_pixel_enabled column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS module_lead_pixel_enabled BOOLEAN DEFAULT false;