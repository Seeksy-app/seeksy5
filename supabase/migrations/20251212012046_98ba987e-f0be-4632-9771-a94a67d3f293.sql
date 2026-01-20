-- Add rate_type column and new rate fields to trucking_loads
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS rate_type text DEFAULT 'flat' CHECK (rate_type IN ('flat', 'per_ton'));

-- Add per-ton rate fields
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS desired_rate_per_ton numeric,
ADD COLUMN IF NOT EXISTS negotiated_rate_per_ton numeric,
ADD COLUMN IF NOT EXISTS tons numeric;

-- Add negotiated flat rate field
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS negotiated_rate numeric;

-- Add floor rate per ton for optional per-ton floor
ALTER TABLE public.trucking_loads 
ADD COLUMN IF NOT EXISTS floor_rate_per_ton numeric;

-- Create index for rate_type queries
CREATE INDEX IF NOT EXISTS idx_trucking_loads_rate_type ON public.trucking_loads(rate_type);