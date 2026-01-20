-- Add transcript column to trucking_call_logs if not exists
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS transcript TEXT;