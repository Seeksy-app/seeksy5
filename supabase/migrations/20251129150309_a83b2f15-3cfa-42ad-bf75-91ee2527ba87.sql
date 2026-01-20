-- Fix clips INSERT policy to work with service role from edge functions

-- Drop the problematic user-based INSERT policy
DROP POLICY IF EXISTS "Users can insert clips" ON clips;

-- Create a simpler INSERT policy that allows both authenticated users and service role
CREATE POLICY "Allow insert clips"
ON clips
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);