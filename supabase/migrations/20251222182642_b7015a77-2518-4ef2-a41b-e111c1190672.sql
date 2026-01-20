-- Fix foreign key constraint to allow deleting leads by setting ON DELETE SET NULL
-- First drop the existing constraint and recreate with SET NULL

ALTER TABLE public.trucking_call_logs 
DROP CONSTRAINT IF EXISTS trucking_call_logs_lead_id_fkey;

ALTER TABLE public.trucking_call_logs 
ADD CONSTRAINT trucking_call_logs_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.trucking_carrier_leads(id) 
ON DELETE SET NULL;