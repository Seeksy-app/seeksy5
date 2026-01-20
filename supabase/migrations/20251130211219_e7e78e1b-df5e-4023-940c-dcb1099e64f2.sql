
-- Fix RLS policy for voice_blockchain_certificates to allow user inserts
-- Current policy "System can insert certificates" may not be working correctly

-- Drop the existing broad insert policy
DROP POLICY IF EXISTS "System can insert certificates" ON voice_blockchain_certificates;

-- Create explicit policy for authenticated users to insert their own certificates
CREATE POLICY "Users can insert own voice certificates"
ON voice_blockchain_certificates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- Add SELECT policy for admins if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'voice_blockchain_certificates' 
    AND policyname = 'Admins can view all certificates'
  ) THEN
    CREATE POLICY "Admins can view all certificates"
    ON voice_blockchain_certificates
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
      )
    );
  END IF;
END $$;
