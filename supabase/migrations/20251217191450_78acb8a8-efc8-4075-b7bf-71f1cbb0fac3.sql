-- Create trucking agent roles enum
CREATE TYPE trucking_role AS ENUM ('owner', 'agent');

-- Create trucking agents table
CREATE TABLE public.trucking_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role trucking_role NOT NULL DEFAULT 'agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(owner_id, email)
);

-- Enable RLS
ALTER TABLE public.trucking_agents ENABLE ROW LEVEL SECURITY;

-- Owners can manage their agents
CREATE POLICY "Owners can manage their agents"
ON public.trucking_agents
FOR ALL
USING (owner_id = auth.uid());

-- Agents can view their own record
CREATE POLICY "Agents can view own record"
ON public.trucking_agents
FOR SELECT
USING (user_id = auth.uid());

-- Function to check if user is trucking owner
CREATE OR REPLACE FUNCTION public.is_trucking_owner(_user_id UUID, _owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = _owner_id
$$;

-- Function to check if user is an agent under an owner
CREATE OR REPLACE FUNCTION public.is_trucking_agent(_user_id UUID, _owner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trucking_agents
    WHERE user_id = _user_id
    AND owner_id = _owner_id
    AND is_active = true
  )
$$;

-- Update trucking_loads policy to allow agents to view loads
CREATE POLICY "Agents can view owner loads"
ON public.trucking_loads
FOR SELECT
USING (
  public.is_trucking_agent(auth.uid(), owner_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_trucking_agents_updated_at
  BEFORE UPDATE ON public.trucking_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();