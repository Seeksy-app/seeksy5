-- Create security_alerts table for tracking and notifying about security issues
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_ip TEXT,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create rate_limit_logs table for tracking rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_endpoint_time 
ON public.rate_limit_logs (ip_address, endpoint, created_at DESC);

-- Create index for security alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_created 
ON public.security_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved 
ON public.security_alerts (is_resolved, severity) WHERE is_resolved = false;

-- Enable RLS
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Security alerts: Only admins can view
CREATE POLICY "Admins can view security alerts" 
ON public.security_alerts FOR SELECT 
USING (public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

CREATE POLICY "Admins can update security alerts" 
ON public.security_alerts FOR UPDATE 
USING (public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin']));

-- Rate limit logs: Service role only (edge functions insert)
CREATE POLICY "Service role can manage rate limit logs" 
ON public.rate_limit_logs FOR ALL 
USING (auth.role() = 'service_role');

-- Cleanup old rate limit logs (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_logs 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Function to log security alert and optionally notify
CREATE OR REPLACE FUNCTION public.log_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_source_ip TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    alert_type, severity, title, description, 
    source_ip, user_id, endpoint, metadata
  ) VALUES (
    p_alert_type, p_severity, p_title, p_description,
    p_source_ip, p_user_id, p_endpoint, p_metadata
  )
  RETURNING id INTO new_alert_id;
  
  RETURN new_alert_id;
END;
$$;