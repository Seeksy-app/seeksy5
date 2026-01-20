-- Fix clips table RLS for INSERT (final fix)
-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own clips" ON clips;
DROP POLICY IF EXISTS "Service role can manage all clips" ON clips;
DROP POLICY IF EXISTS "Authenticated users can insert clips" ON clips;

-- Create simple, direct INSERT policy
CREATE POLICY "Users can create clips for their media"
ON clips
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());