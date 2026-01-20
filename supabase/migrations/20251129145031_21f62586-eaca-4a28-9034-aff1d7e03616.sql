-- Fix RLS policies for ai_edited_assets table to allow edge function access

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view their own edited assets" ON ai_edited_assets;
DROP POLICY IF EXISTS "Users can insert their own edited assets" ON ai_edited_assets;

-- Allow authenticated users and service role to insert edited assets
CREATE POLICY "Allow authenticated insert to ai_edited_assets"
ON ai_edited_assets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own edited assets (via ai_jobs relationship)
CREATE POLICY "Users can view their own edited assets"
ON ai_edited_assets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_jobs
    WHERE ai_jobs.id = ai_edited_assets.ai_job_id
    AND ai_jobs.user_id = auth.uid()
  )
);

-- Allow service role full access for edge functions
CREATE POLICY "Service role has full access to ai_edited_assets"
ON ai_edited_assets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);