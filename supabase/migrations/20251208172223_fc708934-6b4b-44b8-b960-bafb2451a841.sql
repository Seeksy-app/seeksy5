-- =========================================
-- PART 1: DATA & ARCHITECTURE - CFO Assumptions & ProForma Versions
-- =========================================

-- 1) Create cfo_assumptions table for CFO overrides
CREATE TABLE IF NOT EXISTS public.cfo_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT DEFAULT 'number',
  source TEXT NOT NULL DEFAULT 'cfo_override' CHECK (source IN ('cfo_override', 'r_d_default', 'blended')),
  category TEXT DEFAULT 'general',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(metric_key)
);

-- Enable RLS
ALTER TABLE public.cfo_assumptions ENABLE ROW LEVEL SECURITY;

-- Policies for cfo_assumptions - admins can manage, board members can view
CREATE POLICY "Admins can manage CFO assumptions"
ON public.cfo_assumptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin', 'cfo')
  )
);

CREATE POLICY "Board members can view CFO assumptions"
ON public.cfo_assumptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'board_member'
  )
);

-- 2) Create proforma_versions table for saving forecast snapshots
CREATE TABLE IF NOT EXISTS public.proforma_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_key TEXT NOT NULL,
  label TEXT NOT NULL,
  summary TEXT,
  forecast_payload JSONB NOT NULL,
  assumptions_snapshot JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proforma_versions ENABLE ROW LEVEL SECURITY;

-- Policies for proforma_versions
CREATE POLICY "Admins can manage proforma versions"
ON public.proforma_versions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin', 'cfo')
  )
);

CREATE POLICY "Board members can view proforma versions"
ON public.proforma_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'board_member'
  )
);

-- 3) Extend scenario_configs if columns missing
DO $$
BEGIN
  -- Add margin_multiplier if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_configs' AND column_name = 'margin_multiplier'
  ) THEN
    ALTER TABLE public.scenario_configs ADD COLUMN margin_multiplier NUMERIC DEFAULT 1.0;
  END IF;
  
  -- Add description if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenario_configs' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.scenario_configs ADD COLUMN description TEXT;
  END IF;
END $$;

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cfo_assumptions_metric_key ON public.cfo_assumptions(metric_key);
CREATE INDEX IF NOT EXISTS idx_cfo_assumptions_category ON public.cfo_assumptions(category);
CREATE INDEX IF NOT EXISTS idx_proforma_versions_scenario ON public.proforma_versions(scenario_key);
CREATE INDEX IF NOT EXISTS idx_proforma_versions_created_at ON public.proforma_versions(created_at DESC);

-- 5) Add trigger for updated_at on cfo_assumptions
CREATE OR REPLACE TRIGGER update_cfo_assumptions_updated_at
  BEFORE UPDATE ON public.cfo_assumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();