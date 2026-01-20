-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can view their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can update their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can delete their own voice fingerprints" ON creator_voice_fingerprints;

-- Enable RLS on creator_voice_fingerprints
ALTER TABLE creator_voice_fingerprints ENABLE ROW LEVEL SECURITY;

-- Create corrected policies with authenticated role
CREATE POLICY "Users can insert their own voice fingerprints"
ON creator_voice_fingerprints
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice fingerprints"
ON creator_voice_fingerprints
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice fingerprints"
ON creator_voice_fingerprints
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice fingerprints"
ON creator_voice_fingerprints
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);