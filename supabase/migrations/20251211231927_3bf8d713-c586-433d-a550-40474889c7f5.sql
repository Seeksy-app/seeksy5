-- Add cost tracking columns to trucking_call_logs
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS total_characters integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost_usd numeric(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Add pricing and calls enabled columns to trucking_settings
ALTER TABLE public.trucking_settings
ADD COLUMN IF NOT EXISTS ai_price_per_million_chars_usd numeric(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS ai_calls_enabled boolean DEFAULT true;

-- Create RPC function for cost stats
CREATE OR REPLACE FUNCTION public.get_trucking_cost_stats(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  avg_cost numeric;
  monthly_cost numeric;
  calls_last_20 integer;
  calls_this_month integer;
BEGIN
  -- Get avg cost from last 20 non-demo calls
  SELECT 
    AVG(estimated_cost_usd),
    COUNT(*)
  INTO avg_cost, calls_last_20
  FROM (
    SELECT estimated_cost_usd
    FROM trucking_call_logs
    WHERE owner_id = p_owner_id
      AND is_demo = false
      AND outcome IS NOT NULL
    ORDER BY call_started_at DESC
    LIMIT 20
  ) sub;

  -- Get sum for current month
  SELECT 
    COALESCE(SUM(estimated_cost_usd), 0),
    COUNT(*)
  INTO monthly_cost, calls_this_month
  FROM trucking_call_logs
  WHERE owner_id = p_owner_id
    AND is_demo = false
    AND call_started_at >= date_trunc('month', now());

  result := jsonb_build_object(
    'avg_estimated_cost_usd_last_20', COALESCE(avg_cost, 0),
    'sum_estimated_cost_usd_current_month', COALESCE(monthly_cost, 0),
    'calls_count_last_20', COALESCE(calls_last_20, 0),
    'calls_count_current_month', COALESCE(calls_this_month, 0)
  );

  RETURN result;
END;
$$;