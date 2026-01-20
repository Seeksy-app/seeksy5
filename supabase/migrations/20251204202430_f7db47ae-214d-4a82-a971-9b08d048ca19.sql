-- Create lead_magnets table
CREATE TABLE public.lead_magnets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  audience_roles TEXT[] DEFAULT '{}',
  bullets TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;

-- Public can read active lead magnets
CREATE POLICY "Anyone can view active lead magnets"
ON public.lead_magnets
FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage lead magnets"
ON public.lead_magnets
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_lead_magnets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_lead_magnets_updated_at
BEFORE UPDATE ON public.lead_magnets
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_magnets_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_lead_magnets_slug ON public.lead_magnets(slug);
CREATE INDEX idx_lead_magnets_active ON public.lead_magnets(is_active) WHERE is_active = true;