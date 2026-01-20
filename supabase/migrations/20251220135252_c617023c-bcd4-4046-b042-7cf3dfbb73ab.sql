-- Create table for VSO Representatives from VA OGC Accreditation Search
CREATE TABLE public.vso_representatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  organization_name TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  accreditation_type TEXT DEFAULT 'VSO Representative',
  phone TEXT,
  email TEXT,
  source_url TEXT DEFAULT 'https://www.va.gov/ogc/apps/accreditation/index.asp',
  source_name TEXT DEFAULT 'VA OGC Accreditation Search',
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for deduplication
CREATE UNIQUE INDEX idx_vso_rep_unique ON public.vso_representatives (
  full_name, 
  COALESCE(organization_name, ''), 
  COALESCE(street_address, '')
);

-- Create indexes for common queries
CREATE INDEX idx_vso_rep_state ON public.vso_representatives(state);
CREATE INDEX idx_vso_rep_city ON public.vso_representatives(city);
CREATE INDEX idx_vso_rep_org ON public.vso_representatives(organization_name);
CREATE INDEX idx_vso_rep_name ON public.vso_representatives(full_name);
CREATE INDEX idx_vso_rep_zip ON public.vso_representatives(zip_code);

-- Enable RLS
ALTER TABLE public.vso_representatives ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public government data)
CREATE POLICY "VSO representatives are publicly readable"
  ON public.vso_representatives
  FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage VSO representatives"
  ON public.vso_representatives
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_vso_representatives_updated_at
  BEFORE UPDATE ON public.vso_representatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.vso_representatives IS 'Accredited VSO Representatives from VA OGC Accreditation Search for YourBenefits AI Agent';