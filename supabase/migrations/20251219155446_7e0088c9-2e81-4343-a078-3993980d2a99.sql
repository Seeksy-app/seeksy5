-- Add agent_id to trucking_call_logs to track which agent made the call
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES auth.users(id);

-- Add assigned_agent_id to trucking_carrier_leads for agent self-assignment
ALTER TABLE public.trucking_carrier_leads 
ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

-- Create index for efficient agent filtering
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_agent_id ON public.trucking_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_trucking_carrier_leads_assigned_agent_id ON public.trucking_carrier_leads(assigned_agent_id);