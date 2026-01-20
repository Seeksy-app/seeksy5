-- Add service_role policies to allow edge functions to bypass RLS

-- Service role policy for clips table
DROP POLICY IF EXISTS "service_role_all_clips" ON public.clips;
CREATE POLICY "service_role_all_clips"
  ON public.clips
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policy for ai_jobs table
DROP POLICY IF EXISTS "service_role_all_ai_jobs" ON public.ai_jobs;
CREATE POLICY "service_role_all_ai_jobs"
  ON public.ai_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role policy for ai_edited_assets table
DROP POLICY IF EXISTS "service_role_all_ai_edited_assets" ON public.ai_edited_assets;
CREATE POLICY "service_role_all_ai_edited_assets"
  ON public.ai_edited_assets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');