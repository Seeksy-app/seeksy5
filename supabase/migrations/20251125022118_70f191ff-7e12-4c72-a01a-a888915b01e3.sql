-- Add assigned_to and related fields to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for assigned tickets
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);

-- Update RLS policies to allow assigned users to view/update tickets
CREATE POLICY "Assigned users can view their tickets"
  ON public.tickets
  FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Assigned users can update their tickets"
  ON public.tickets
  FOR UPDATE
  USING (assigned_to = auth.uid());