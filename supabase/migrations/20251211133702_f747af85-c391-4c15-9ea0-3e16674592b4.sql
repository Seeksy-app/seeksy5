-- Add expiration and NDA fields to sales_opportunities
ALTER TABLE public.sales_opportunities
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS require_nda_board BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_nda_recipient BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nda_text TEXT;

-- Create opportunity_proformas table for CFO-created pro formas per opportunity
CREATE TABLE IF NOT EXISTS public.opportunity_proformas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Financial projections
  revenue_year1 NUMERIC,
  revenue_year2 NUMERIC,
  revenue_year3 NUMERIC,
  expenses_year1 NUMERIC,
  expenses_year2 NUMERIC,
  expenses_year3 NUMERIC,
  ebitda_year1 NUMERIC,
  ebitda_year2 NUMERIC,
  ebitda_year3 NUMERIC,
  
  -- Market data
  target_market TEXT,
  market_size TEXT,
  addressable_market TEXT,
  
  -- Model inputs (JSON for flexibility)
  assumptions JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opportunity_proformas ENABLE ROW LEVEL SECURITY;

-- Admins and CFO can manage pro formas
CREATE POLICY "Admins can manage opportunity proformas"
  ON public.opportunity_proformas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'platform_owner', 'admin', 'cfo')
    )
  );

-- Board members can view active pro formas
CREATE POLICY "Board members can view opportunity proformas"
  ON public.opportunity_proformas
  FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'platform_owner', 'admin', 'cfo', 'board_member')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_opportunity_proformas_updated_at
  BEFORE UPDATE ON public.opportunity_proformas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Junction table for linking pro formas to opportunities (for selection)
CREATE TABLE IF NOT EXISTS public.sales_opportunity_proformas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  proforma_id UUID NOT NULL REFERENCES public.opportunity_proformas(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(opportunity_id, proforma_id)
);

-- Enable RLS for junction table
ALTER TABLE public.sales_opportunity_proformas ENABLE ROW LEVEL SECURITY;

-- Admins can manage links
CREATE POLICY "Admins can manage opportunity proforma links"
  ON public.sales_opportunity_proformas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'platform_owner', 'admin', 'cfo', 'board_member')
    )
  );