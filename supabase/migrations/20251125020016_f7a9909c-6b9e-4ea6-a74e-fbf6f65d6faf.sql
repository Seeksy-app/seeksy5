-- Fix search_path for update_pipeline_stages_updated_at function
DROP TRIGGER IF EXISTS update_pipeline_stages_timestamp ON public.pipeline_stages;
DROP FUNCTION IF EXISTS update_pipeline_stages_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_pipeline_stages_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipeline_stages_timestamp
BEFORE UPDATE ON public.pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION update_pipeline_stages_updated_at();