-- Add is_archived column to trucking_carrier_leads table
ALTER TABLE public.trucking_carrier_leads 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add archived_at timestamp column
ALTER TABLE public.trucking_carrier_leads 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create index for efficient archived queries
CREATE INDEX IF NOT EXISTS idx_trucking_carrier_leads_archived 
ON public.trucking_carrier_leads(owner_id, is_archived);