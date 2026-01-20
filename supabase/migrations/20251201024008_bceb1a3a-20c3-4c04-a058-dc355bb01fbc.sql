-- Create database function to increment campaign statistics
CREATE OR REPLACE FUNCTION public.increment_campaign_stat(
  p_campaign_id UUID,
  p_field TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE email_campaigns SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    p_field, p_field
  )
  USING p_campaign_id;
END;
$$;