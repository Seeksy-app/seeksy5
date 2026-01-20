-- Fix DELETE policy on clips table
-- The existing policy checks ai_jobs table but clips have direct user_id ownership

DROP POLICY IF EXISTS "Users can delete their own clips" ON clips;

CREATE POLICY "Users can delete their own clips"
ON clips
FOR DELETE
TO authenticated
USING (user_id = auth.uid());