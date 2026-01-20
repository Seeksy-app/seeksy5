-- Add broker commission field to trucking_loads
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS broker_commission NUMERIC DEFAULT NULL;