-- Add truck_size column to trucking_loads table
ALTER TABLE public.trucking_loads ADD COLUMN IF NOT EXISTS truck_size text;