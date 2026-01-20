-- Fix RLS policies for clips table to allow proper deletion

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can delete their own clips" ON clips;
DROP POLICY IF EXISTS "Users can view their own clips" ON clips;
DROP POLICY IF EXISTS "Users can insert their own clips" ON clips;
DROP POLICY IF EXISTS "Users can update their own clips" ON clips;

-- Allow users to view their own clips (via ai_jobs relationship)
CREATE POLICY "Users can view their own clips"
ON clips
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_jobs
    WHERE ai_jobs.id = clips.ai_job_id
    AND ai_jobs.user_id = auth.uid()
  )
);

-- Allow users to update their own clips
CREATE POLICY "Users can update their own clips"
ON clips
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_jobs
    WHERE ai_jobs.id = clips.ai_job_id
    AND ai_jobs.user_id = auth.uid()
  )
);

-- Allow users to delete their own clips
CREATE POLICY "Users can delete their own clips"
ON clips
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ai_jobs
    WHERE ai_jobs.id = clips.ai_job_id
    AND ai_jobs.user_id = auth.uid()
  )
);

-- Allow service role full access
CREATE POLICY "Service role has full access to clips"
ON clips
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);