-- ====================================================================
-- ADMIN FINANCE & AD REVENUE MODEL - DATABASE SCHEMA
-- ====================================================================

-- Revenue Reports Table
CREATE TABLE IF NOT EXISTS public.admin_revenue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  source TEXT NOT NULL,
  gross_revenue NUMERIC NOT NULL DEFAULT 0,
  refunds NUMERIC NOT NULL DEFAULT 0,
  net_revenue NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_revenue_reports_period
  ON public.admin_revenue_reports (period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_admin_revenue_reports_source
  ON public.admin_revenue_reports (source);

-- Billing Invoices Table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  customer_id UUID,
  customer_name TEXT,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL,
  status TEXT NOT NULL,
  due_date DATE,
  issued_at TIMESTAMPTZ,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status
  ON public.billing_invoices (status);

-- Ad Financial Scenarios
CREATE TABLE IF NOT EXISTS public.ad_financial_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad Financial Assumptions
CREATE TABLE IF NOT EXISTS public.ad_financial_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ad_financial_scenarios(id) ON DELETE CASCADE,
  starting_creators INTEGER NOT NULL,
  monthly_creator_growth NUMERIC NOT NULL,
  percent_creators_monetized NUMERIC NOT NULL,
  episodes_per_creator_per_month NUMERIC NOT NULL,
  listens_per_episode NUMERIC NOT NULL,
  ad_slots_per_listen NUMERIC NOT NULL,
  fill_rate NUMERIC NOT NULL,
  cpm_preroll NUMERIC NOT NULL,
  cpm_midroll NUMERIC NOT NULL,
  cpm_postroll NUMERIC NOT NULL,
  share_preroll NUMERIC NOT NULL,
  share_midroll NUMERIC NOT NULL,
  share_postroll NUMERIC NOT NULL,
  creator_rev_share NUMERIC NOT NULL,
  platform_variable_cost_pct NUMERIC NOT NULL,
  starting_campaigns INTEGER NOT NULL,
  monthly_campaign_growth NUMERIC NOT NULL,
  avg_campaign_monthly_budget NUMERIC NOT NULL,
  avg_campaign_duration_months NUMERIC NOT NULL,
  projection_months INTEGER NOT NULL DEFAULT 36,
  currency TEXT NOT NULL DEFAULT 'USD',
  assumptions_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad Financial Projections
CREATE TABLE IF NOT EXISTS public.ad_financial_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ad_financial_scenarios(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  creators INTEGER NOT NULL,
  monetized_creators INTEGER NOT NULL,
  episodes INTEGER NOT NULL,
  impressions_preroll NUMERIC NOT NULL,
  impressions_midroll NUMERIC NOT NULL,
  impressions_postroll NUMERIC NOT NULL,
  total_impressions NUMERIC NOT NULL,
  gross_revenue_preroll NUMERIC NOT NULL,
  gross_revenue_midroll NUMERIC NOT NULL,
  gross_revenue_postroll NUMERIC NOT NULL,
  gross_revenue_total NUMERIC NOT NULL,
  active_campaigns INTEGER NOT NULL,
  max_billable_revenue NUMERIC NOT NULL,
  constrained_gross_revenue NUMERIC NOT NULL,
  creator_payout NUMERIC NOT NULL,
  platform_variable_costs NUMERIC NOT NULL,
  platform_net_revenue NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_financial_projections_scenario
  ON public.ad_financial_projections (scenario_id);

CREATE INDEX IF NOT EXISTS idx_ad_financial_projections_month
  ON public.ad_financial_projections (scenario_id, month_index);

-- CFO AI Summary Table (without vector for now)
CREATE TABLE IF NOT EXISTS public.ad_financial_model_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.ad_financial_scenarios(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_revenue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_financial_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_financial_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_financial_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_financial_model_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view revenue reports"
  ON public.admin_revenue_reports FOR SELECT
  USING (is_adm());

CREATE POLICY "Admins can insert revenue reports"
  ON public.admin_revenue_reports FOR INSERT
  WITH CHECK (is_adm());

CREATE POLICY "Admins can manage invoices"
  ON public.billing_invoices FOR ALL
  USING (is_adm());

CREATE POLICY "Admins can manage scenarios"
  ON public.ad_financial_scenarios FOR ALL
  USING (is_adm());

CREATE POLICY "Admins can manage assumptions"
  ON public.ad_financial_assumptions FOR ALL
  USING (is_adm());

CREATE POLICY "Admins can manage projections"
  ON public.ad_financial_projections FOR ALL
  USING (is_adm());

CREATE POLICY "Admins can manage summaries"
  ON public.ad_financial_model_summaries FOR ALL
  USING (is_adm());