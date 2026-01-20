-- Add assigned_agent_id column to trucking_loads for load ownership
ALTER TABLE public.trucking_loads 
ADD COLUMN assigned_agent_id UUID REFERENCES auth.users(id);

-- Add index for efficient agent load queries
CREATE INDEX idx_trucking_loads_assigned_agent ON public.trucking_loads(assigned_agent_id);

-- Add assigned_at timestamp to track when load was taken
ALTER TABLE public.trucking_loads 
ADD COLUMN assigned_at TIMESTAMPTZ;