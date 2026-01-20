-- Drop and recreate policies without explicit TO authenticated clause
DROP POLICY IF EXISTS "Users can insert their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Authenticated users can view available voice profiles" ON creator_voice_profiles;

DROP POLICY IF EXISTS "Users can insert their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can view their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can update their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can delete their own voice fingerprints" ON creator_voice_fingerprints;
DROP POLICY IF EXISTS "Users can create their own voice fingerprints" ON creator_voice_fingerprints;

-- Create policies for creator_voice_profiles
CREATE POLICY "Users can insert their own voice profiles"
ON creator_voice_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice profiles"
ON creator_voice_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profiles"
ON creator_voice_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice profiles"
ON creator_voice_profiles
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Advertisers can view available voice profiles"
ON creator_voice_profiles
FOR SELECT
USING (is_available_for_ads = true AND is_verified = true);

-- Create policies for creator_voice_fingerprints
CREATE POLICY "Users can insert their own voice fingerprints"
ON creator_voice_fingerprints
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice fingerprints"
ON creator_voice_fingerprints
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice fingerprints"
ON creator_voice_fingerprints
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice fingerprints"
ON creator_voice_fingerprints
FOR DELETE
USING (auth.uid() = user_id);