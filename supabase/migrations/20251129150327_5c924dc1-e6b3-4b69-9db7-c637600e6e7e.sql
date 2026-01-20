-- Fix clips table to allow user_id column (currently missing)
-- and create proper INSERT policy

-- First check if user_id column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clips' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clips ADD COLUMN user_id UUID REFERENCES auth.users(id);
    CREATE INDEX idx_clips_user_id ON clips(user_id);
  END IF;
END $$;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Allow insert clips" ON clips;

-- Create new INSERT policy that works with user_id
CREATE POLICY "Users can insert their own clips"
ON clips
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());