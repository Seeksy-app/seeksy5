-- Add mc_pending column to trucking_carrier_leads
ALTER TABLE public.trucking_carrier_leads 
ADD COLUMN IF NOT EXISTS mc_pending BOOLEAN DEFAULT false;