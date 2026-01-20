-- Add confirmed lead tracking to trucking_carrier_leads
ALTER TABLE public.trucking_carrier_leads
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS call_log_id UUID REFERENCES public.trucking_call_logs(id);

-- Create index for faster confirmed leads queries
CREATE INDEX IF NOT EXISTS idx_trucking_carrier_leads_confirmed 
ON public.trucking_carrier_leads(owner_id, is_confirmed, created_at DESC);

-- Create RPC to get confirmed leads count for dashboard
CREATE OR REPLACE FUNCTION public.get_trucking_dashboard_stats(p_owner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'open_loads', (SELECT COUNT(*) FROM trucking_loads WHERE owner_id = p_owner_id AND status = 'open'),
    'leads_today', (SELECT COUNT(*) FROM trucking_carrier_leads WHERE owner_id = p_owner_id AND is_confirmed = false AND created_at >= CURRENT_DATE),
    'calls_today', (SELECT COUNT(*) FROM trucking_call_logs WHERE owner_id = p_owner_id AND call_started_at >= CURRENT_DATE),
    'confirmed_leads', (SELECT COUNT(*) FROM trucking_carrier_leads WHERE owner_id = p_owner_id AND is_confirmed = true)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;