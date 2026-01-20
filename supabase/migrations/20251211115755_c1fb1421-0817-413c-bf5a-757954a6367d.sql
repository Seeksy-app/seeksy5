-- Create veteran_leads table for capturing leads from Claims Agent
CREATE TABLE public.veteran_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'claims-agent-mvp',
  notes TEXT,
  pdf_url TEXT,
  branch_of_service TEXT,
  service_dates TEXT,
  conditions TEXT[],
  existing_rating INTEGER,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veteran_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for unauthenticated leads from Claims Agent)
CREATE POLICY "Allow public inserts to veteran_leads"
ON public.veteran_leads
FOR INSERT
WITH CHECK (true);

-- Only admins can view/update/delete leads
CREATE POLICY "Admins can view veteran_leads"
ON public.veteran_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update veteran_leads"
ON public.veteran_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_veteran_leads_updated_at
BEFORE UPDATE ON public.veteran_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();