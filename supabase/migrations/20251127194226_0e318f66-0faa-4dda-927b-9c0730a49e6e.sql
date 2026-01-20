-- Fix RLS policies for creator_voice_profiles to allow inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can insert their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON creator_voice_profiles;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON creator_voice_profiles;

-- Create comprehensive policies
CREATE POLICY "Users can view their own voice profiles"
ON creator_voice_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice profiles"
ON creator_voice_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profiles"
ON creator_voice_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice profiles"
ON creator_voice_profiles
FOR DELETE
USING (auth.uid() = user_id);