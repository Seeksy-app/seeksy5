-- Skip rd_benchmarks alterations for now, create new tables only

-- Create rd_market_data table for segment-level TAM/SAM/SOM
CREATE TABLE IF NOT EXISTS public.rd_market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Global',
  year INTEGER NOT NULL,
  tam NUMERIC NOT NULL,
  sam NUMERIC,
  som NUMERIC,
  cagr NUMERIC,
  notes TEXT,
  source TEXT DEFAULT 'R&D 2025',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(segment, region, year)
);

-- Create scenario_configs table for CFO-editable multipliers
CREATE TABLE IF NOT EXISTS public.scenario_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  revenue_growth_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  market_adoption_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  churn_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  cac_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  impressions_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  cpm_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  fill_rate_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  platform_revshare_adjustment NUMERIC NOT NULL DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proforma_forecasts table to store generated forecasts
CREATE TABLE IF NOT EXISTS public.proforma_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_key TEXT NOT NULL,
  forecast_year INTEGER NOT NULL,
  revenue_data JSONB NOT NULL DEFAULT '{}',
  expense_data JSONB NOT NULL DEFAULT '{}',
  ad_revenue_breakdown JSONB NOT NULL DEFAULT '{}',
  summary_metrics JSONB NOT NULL DEFAULT '{}',
  benchmarks_used JSONB NOT NULL DEFAULT '[]',
  ai_commentary TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.rd_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS policies for rd_market_data
CREATE POLICY "Admins and board can read rd_market_data"
  ON public.rd_market_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'board_member'));

CREATE POLICY "Admins can manage rd_market_data"
  ON public.rd_market_data FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for scenario_configs
CREATE POLICY "Admins and board can read scenario_configs"
  ON public.scenario_configs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'board_member'));

CREATE POLICY "Admins can manage scenario_configs"
  ON public.scenario_configs FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS policies for proforma_forecasts
CREATE POLICY "Admins and board can read proforma_forecasts"
  ON public.proforma_forecasts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'board_member'));

CREATE POLICY "Admins can manage proforma_forecasts"
  ON public.proforma_forecasts FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rd_market_data_segment ON public.rd_market_data(segment);
CREATE INDEX IF NOT EXISTS idx_proforma_forecasts_scenario ON public.proforma_forecasts(scenario_key);

-- Insert default scenario configurations
INSERT INTO public.scenario_configs (scenario_key, label, revenue_growth_multiplier, market_adoption_multiplier, churn_multiplier, cac_multiplier, impressions_multiplier, cpm_multiplier, fill_rate_multiplier, platform_revshare_adjustment)
VALUES 
  ('conservative', 'Conservative', 0.70, 0.80, 1.25, 1.15, 0.80, 0.85, 0.85, 0.0),
  ('base', 'Base', 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0),
  ('aggressive', 'Aggressive', 1.30, 1.25, 0.75, 0.85, 1.25, 1.15, 1.10, 0.05)
ON CONFLICT (scenario_key) DO NOTHING;