-- Add is_locked column to cfo_assumptions for CFO Lock Mode
-- Also add a cfo_lock_status table to track global lock state

-- Create a table to track global CFO lock status
CREATE TABLE public.cfo_lock_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cfo_lock_status ENABLE ROW LEVEL SECURITY;

-- Create policies - admins/CFO can view and update
CREATE POLICY "Authenticated users can view lock status" 
ON public.cfo_lock_status 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update lock status" 
ON public.cfo_lock_status 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can insert lock status" 
ON public.cfo_lock_status 
FOR INSERT 
WITH CHECK (true);

-- Insert default unlocked state
INSERT INTO public.cfo_lock_status (is_locked) VALUES (false);