-- Add name field to investor application settings
ALTER TABLE public.investor_application_settings 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Default Application';

-- Add slug for URL routing
ALTER TABLE public.investor_application_settings 
ADD COLUMN slug TEXT UNIQUE;

-- Create index for slug lookups
CREATE INDEX idx_investor_settings_slug ON public.investor_application_settings(slug);