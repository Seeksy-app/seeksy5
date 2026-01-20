-- Fix RLS policies for ai_jobs table to allow edge function access

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON ai_jobs;

-- Allow users to view their own jobs
CREATE POLICY "Users can view their own jobs"
ON ai_jobs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own jobs
CREATE POLICY "Users can insert their own jobs"
ON ai_jobs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own jobs
CREATE POLICY "Users can update their own jobs"
ON ai_jobs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow service role full access for edge functions
CREATE POLICY "Service role has full access to ai_jobs"
ON ai_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);