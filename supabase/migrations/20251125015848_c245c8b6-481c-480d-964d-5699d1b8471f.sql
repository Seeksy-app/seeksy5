-- Add pipeline system for contacts
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add pipeline_stage_id to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;

-- Add sent_at column to proposals for tracking when proposals are sent
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_to_email TEXT;

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Policies for pipeline_stages
CREATE POLICY "Users can view their own pipeline stages"
  ON public.pipeline_stages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pipeline stages"
  ON public.pipeline_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline stages"
  ON public.pipeline_stages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own non-system pipeline stages"
  ON public.pipeline_stages FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Create default pipeline stages for all existing users
INSERT INTO public.pipeline_stages (user_id, name, display_order, color, is_system)
SELECT DISTINCT user_id, 'Lead', 0, '#94a3b8', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Contacted', 1, '#3b82f6', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Proposal Sent', 2, '#8b5cf6', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Won', 3, '#10b981', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Invoiced', 4, '#f59e0b', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Paid', 5, '#22c55e', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id)
UNION ALL
SELECT DISTINCT user_id, 'Complete', 6, '#06b6d4', true FROM public.contacts
WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE user_id = contacts.user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_pipeline_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_stages_timestamp
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stages_updated_at();