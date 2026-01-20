-- Create CFO notes table for storing notes that CFO can edit and Board can view
CREATE TABLE public.cfo_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.cfo_notes ENABLE ROW LEVEL SECURITY;

-- Admins and Board can read all notes
CREATE POLICY "Authenticated users can view CFO notes" 
ON public.cfo_notes 
FOR SELECT 
USING (true);

-- Only admins can update CFO notes
CREATE POLICY "Admins can manage CFO notes" 
ON public.cfo_notes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'cfo')
  )
);

-- Seed initial row for financial statements page
INSERT INTO public.cfo_notes (page_key, notes) 
VALUES ('financial_statements', '');