-- Add new fields to trucking_call_logs for better tracking
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS outcome text,
ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.trucking_carrier_leads(id),
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS failure_reason text;