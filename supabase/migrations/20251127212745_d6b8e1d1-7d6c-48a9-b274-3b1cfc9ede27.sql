-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Advertisers can view available voices" ON creator_voice_profiles;

-- Create corrected policies with authenticated role
CREATE POLICY "Users can insert their own voice profiles"
ON creator_voice_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own voice profiles"
ON creator_voice_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profiles"
ON creator_voice_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice profiles"
ON creator_voice_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view available voice profiles"
ON creator_voice_profiles
FOR SELECT
TO authenticated
USING (is_available_for_ads = true AND is_verified = true);