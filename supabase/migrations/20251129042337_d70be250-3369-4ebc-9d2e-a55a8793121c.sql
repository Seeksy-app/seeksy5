-- Fix search_path security warning for app_settings trigger function
DROP FUNCTION IF EXISTS update_app_settings_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();