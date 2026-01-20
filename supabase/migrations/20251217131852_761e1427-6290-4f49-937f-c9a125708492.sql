-- Add carrier_name column to trucking_loads for storing assigned carrier info from Aljex imports
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS carrier_name TEXT;