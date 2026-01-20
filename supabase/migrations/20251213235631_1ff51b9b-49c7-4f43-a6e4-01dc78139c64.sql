-- Add template_name column to investor_application_settings
ALTER TABLE public.investor_application_settings 
ADD COLUMN IF NOT EXISTS template_name text;