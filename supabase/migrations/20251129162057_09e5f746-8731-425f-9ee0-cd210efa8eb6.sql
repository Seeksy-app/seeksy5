-- Add direct user_id-based SELECT policy for clips
-- This allows users to view clips they own directly, without requiring ai_job_id
CREATE POLICY "Users can view clips they own directly"
ON clips
FOR SELECT
TO authenticated
USING (user_id = auth.uid());