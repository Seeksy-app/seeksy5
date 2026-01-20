-- Add data_mode column to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS data_mode TEXT NOT NULL DEFAULT 'live';

-- Add is_demo flag to existing tables

-- Contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Meetings
ALTER TABLE public.meeting_types ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Financials / Pro Forma
ALTER TABLE public.proforma_forecasts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.proforma_versions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.rd_benchmarks ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.rd_market_data ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Board Portal
ALTER TABLE public.investor_links ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Marketing / Campaigns
ALTER TABLE public.ad_campaigns ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.advertisers ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Events & Awards
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Podcasts / Episodes
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Daily Briefs
ALTER TABLE public.daily_briefs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Competitor profiles
ALTER TABLE public.competitor_profiles ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Update existing app_settings to have data_mode = 'live'
UPDATE public.app_settings SET data_mode = 'live' WHERE key = 'global';

-- Create indexes for is_demo filtering performance
CREATE INDEX IF NOT EXISTS idx_contacts_is_demo ON public.contacts(is_demo);
CREATE INDEX IF NOT EXISTS idx_meeting_types_is_demo ON public.meeting_types(is_demo);
CREATE INDEX IF NOT EXISTS idx_proforma_forecasts_is_demo ON public.proforma_forecasts(is_demo);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_is_demo ON public.ad_campaigns(is_demo);
CREATE INDEX IF NOT EXISTS idx_events_is_demo ON public.events(is_demo);
CREATE INDEX IF NOT EXISTS idx_podcasts_is_demo ON public.podcasts(is_demo);
CREATE INDEX IF NOT EXISTS idx_episodes_is_demo ON public.episodes(is_demo);