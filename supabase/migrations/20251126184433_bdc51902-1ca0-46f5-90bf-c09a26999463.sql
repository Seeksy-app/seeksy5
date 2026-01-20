-- Add missing module columns to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS module_newsletter_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS module_forms_enabled BOOLEAN DEFAULT false;