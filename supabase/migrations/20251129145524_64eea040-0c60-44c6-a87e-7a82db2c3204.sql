-- Add missing INSERT policy for clips table

-- Allow authenticated users and service role to insert clips
CREATE POLICY "Users can insert clips"
ON clips
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_jobs
    WHERE ai_jobs.id = clips.ai_job_id
    AND ai_jobs.user_id = auth.uid()
  )
);