-- Update credit_packages with new bundles
DELETE FROM credit_packages;

INSERT INTO credit_packages (name, credits, price, display_order, is_active, stripe_price_id) VALUES
  ('Starter', 300, 19.00, 1, true, null),
  ('Creator', 600, 39.00, 2, true, null),
  ('Pro', 1200, 79.00, 3, true, null),
  ('Power User', 2500, 149.00, 4, true, null),
  ('Studio Team', 5000, 279.00, 5, true, null);

-- Create user_usage_limits table for free tier tracking
CREATE TABLE IF NOT EXISTS public.user_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  free_storage_gb DECIMAL(10,2) DEFAULT 25.00,
  free_recording_minutes_monthly INTEGER DEFAULT 600, -- 10 hours
  free_streaming_minutes_monthly INTEGER DEFAULT 300, -- 5 hours
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  recording_minutes_used INTEGER DEFAULT 0,
  streaming_minutes_used INTEGER DEFAULT 0,
  usage_period_start TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_auto_renew_settings table
CREATE TABLE IF NOT EXISTS public.user_auto_renew_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  package_id UUID REFERENCES credit_packages(id),
  trigger_threshold INTEGER DEFAULT 100, -- Credits balance threshold
  trigger_on_storage_limit BOOLEAN DEFAULT true,
  trigger_on_recording_limit BOOLEAN DEFAULT true,
  last_auto_purchase_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cfo_credit_analytics view for CFO dashboard
CREATE OR REPLACE VIEW public.cfo_credit_analytics AS
SELECT 
  date_trunc('month', ct.created_at) as month,
  COUNT(DISTINCT ct.user_id) as active_users,
  SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as credits_consumed,
  SUM(CASE WHEN ct.transaction_type = 'purchase' THEN ct.amount ELSE 0 END) as credits_purchased,
  SUM(CASE WHEN ct.transaction_type = 'purchase' THEN 
    (SELECT price FROM credit_packages WHERE credits <= ct.amount ORDER BY credits DESC LIMIT 1) 
  ELSE 0 END) as estimated_revenue,
  COUNT(CASE WHEN ars.enabled = true THEN 1 END) as auto_renew_users
FROM credit_transactions ct
LEFT JOIN user_auto_renew_settings ars ON ct.user_id = ars.user_id
GROUP BY date_trunc('month', ct.created_at);

-- Enable RLS
ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_auto_renew_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_usage_limits
CREATE POLICY "Users can view their own usage limits"
  ON public.user_usage_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage limits"
  ON public.user_usage_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage limits"
  ON public.user_usage_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_auto_renew_settings
CREATE POLICY "Users can view their own auto renew settings"
  ON public.user_auto_renew_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto renew settings"
  ON public.user_auto_renew_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto renew settings"
  ON public.user_auto_renew_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all usage limits"
  ON public.user_usage_limits FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view all auto renew settings"
  ON public.user_auto_renew_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_limits_user_id ON public.user_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auto_renew_settings_user_id ON public.user_auto_renew_settings(user_id);

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_usage_limits 
  SET 
    recording_minutes_used = 0,
    streaming_minutes_used = 0,
    usage_period_start = date_trunc('month', now()),
    updated_at = now()
  WHERE usage_period_start < date_trunc('month', now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;