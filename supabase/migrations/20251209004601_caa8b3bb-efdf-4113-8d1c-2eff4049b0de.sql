-- =====================================================
-- CFO FINANCIAL MODELING SYSTEM UPGRADE
-- Adds Expenses, Capital Events, and Updated Scenarios
-- =====================================================

-- 1. Create CFO Expenses table for the Expense Engine
CREATE TABLE public.cfo_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('fixed', 'variable', 'marketing')),
  expense_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'USD',
  is_monthly BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create CFO Capital Events table for Capital & Runway Engine
CREATE TABLE public.cfo_capital_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('investment', 'loan', 'grant', 'revenue_milestone', 'expense_reduction')),
  amount NUMERIC NOT NULL,
  timing_quarter TEXT NOT NULL, -- e.g., 'Q1-2025', 'Q2-2025'
  timing_year INTEGER NOT NULL,
  allocation_runway NUMERIC DEFAULT 0, -- % to extend runway
  allocation_cac NUMERIC DEFAULT 0, -- % to increase CAC spend
  allocation_hiring NUMERIC DEFAULT 0, -- % to hiring
  allocation_infrastructure NUMERIC DEFAULT 0, -- % to infrastructure
  label TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create CFO Cash Position table
CREATE TABLE public.cfo_cash_position (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  current_cash NUMERIC NOT NULL DEFAULT 0,
  monthly_burn_rate NUMERIC DEFAULT 0,
  cash_runway_months NUMERIC DEFAULT 0,
  break_even_month INTEGER, -- month index when break-even achieved
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Update scenario_configs to use Base/Growth/Aggressive naming
-- First, update existing scenarios
UPDATE public.scenario_configs 
SET 
  label = 'Growth',
  scenario_key = 'growth',
  revenue_growth_multiplier = 0.85,
  cpm_multiplier = 0.9,
  fill_rate_multiplier = 0.85,
  churn_multiplier = 1.15
WHERE scenario_key = 'conservative';

-- Ensure base scenario has 1.0 multipliers
UPDATE public.scenario_configs 
SET 
  label = 'Base (CFO Baseline)',
  revenue_growth_multiplier = 1.0,
  cpm_multiplier = 1.0,
  fill_rate_multiplier = 1.0,
  churn_multiplier = 1.0,
  market_adoption_multiplier = 1.0,
  cac_multiplier = 1.0,
  impressions_multiplier = 1.0
WHERE scenario_key = 'base';

-- Ensure aggressive scenario has positive multipliers
UPDATE public.scenario_configs 
SET 
  label = 'Aggressive',
  revenue_growth_multiplier = 1.30,
  cpm_multiplier = 1.20,
  fill_rate_multiplier = 1.15,
  churn_multiplier = 0.75
WHERE scenario_key = 'aggressive';

-- 5. Enable RLS on new tables
ALTER TABLE public.cfo_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfo_capital_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfo_cash_position ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Admin only access
CREATE POLICY "Admins can manage expenses" ON public.cfo_expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'cfo'))
  );

CREATE POLICY "Admins can manage capital events" ON public.cfo_capital_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'cfo'))
  );

CREATE POLICY "Admins can manage cash position" ON public.cfo_cash_position
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'cfo'))
  );

-- 7. Create triggers for updated_at
CREATE TRIGGER update_cfo_expenses_updated_at
  BEFORE UPDATE ON public.cfo_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cfo_capital_events_updated_at
  BEFORE UPDATE ON public.cfo_capital_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cfo_cash_position_updated_at
  BEFORE UPDATE ON public.cfo_cash_position
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Seed default expense categories
INSERT INTO public.cfo_expenses (category, expense_key, label, value, unit, is_monthly, notes) VALUES
-- Fixed Costs
('fixed', 'headcount_engineering', 'Engineering Team', 45000, 'USD', true, 'Engineering salaries'),
('fixed', 'headcount_sales', 'Sales Team', 25000, 'USD', true, 'Sales team salaries'),
('fixed', 'headcount_support', 'Customer Support', 15000, 'USD', true, 'Support team salaries'),
('fixed', 'headcount_executive', 'Executive Team', 40000, 'USD', true, 'Executive compensation'),
('fixed', 'rent', 'Office Rent', 5000, 'USD', true, 'Office space'),
('fixed', 'saas_tools', 'SaaS Subscriptions', 3000, 'USD', true, 'Software tools'),
('fixed', 'insurance', 'Insurance', 2000, 'USD', true, 'Business insurance'),
('fixed', 'infrastructure_base', 'Infrastructure Baseline', 8000, 'USD', true, 'AWS/GCP baseline costs'),
-- Variable Costs
('variable', 'infra_per_creator', 'Infrastructure per Creator', 2, 'USD', true, 'Variable cloud cost per active creator'),
('variable', 'payment_processing', 'Payment Processing', 2.9, 'percent', true, 'Stripe/payment fees'),
('variable', 'creator_payouts', 'Creator Payouts', 70, 'percent', true, 'Revenue share to creators'),
-- Marketing (auto-linked from CAC calculator)
('marketing', 'paid_ads', 'Paid Advertising', 10000, 'USD', true, 'Monthly ad spend'),
('marketing', 'content_marketing', 'Content Marketing', 3000, 'USD', true, 'Blog, video, social content'),
('marketing', 'events_marketing', 'Events & Conferences', 2000, 'USD', true, 'Event sponsorships')
ON CONFLICT (expense_key) DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX idx_cfo_expenses_category ON public.cfo_expenses(category);
CREATE INDEX idx_cfo_capital_events_timing ON public.cfo_capital_events(timing_year, timing_quarter);
CREATE INDEX idx_cfo_capital_events_active ON public.cfo_capital_events(is_active);