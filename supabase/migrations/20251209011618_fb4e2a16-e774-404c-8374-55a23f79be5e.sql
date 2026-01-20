-- Create CFO Pro Forma Versions table
CREATE TABLE public.cfo_proforma_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  assumptions JSONB NOT NULL,
  is_published BOOLEAN DEFAULT true,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.cfo_proforma_versions ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert
CREATE POLICY "Admins can create proforma versions"
ON public.cfo_proforma_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'cfo')
  )
);

-- Allow admins to view
CREATE POLICY "Admins can view proforma versions"
ON public.cfo_proforma_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'cfo', 'board_member')
  )
);

-- Allow admins to update
CREATE POLICY "Admins can update proforma versions"
ON public.cfo_proforma_versions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'cfo')
  )
);

-- Allow admins to delete
CREATE POLICY "Admins can delete proforma versions"
ON public.cfo_proforma_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'cfo')
  )
);

-- Create index for faster retrieval of latest version
CREATE INDEX idx_cfo_proforma_versions_created_at ON public.cfo_proforma_versions(created_at DESC);