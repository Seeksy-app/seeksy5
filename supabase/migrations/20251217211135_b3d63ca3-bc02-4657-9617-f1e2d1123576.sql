-- Add tarp_required column to trucking_loads table
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS tarp_required BOOLEAN DEFAULT false;