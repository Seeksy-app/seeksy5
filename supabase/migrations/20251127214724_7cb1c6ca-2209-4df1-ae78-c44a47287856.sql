-- Ensure RLS is enabled
ALTER TABLE creator_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_voice_fingerprints ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'creator_voice_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON creator_voice_profiles';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'creator_voice_fingerprints') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON creator_voice_fingerprints';
    END LOOP;
END $$;

-- Create policies for creator_voice_profiles
CREATE POLICY "Users can insert own voice profiles"
ON creator_voice_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own voice profiles"
ON creator_voice_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profiles"
ON creator_voice_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice profiles"
ON creator_voice_profiles
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Advertisers can view available profiles"
ON creator_voice_profiles
FOR SELECT
USING (is_available_for_ads = true AND is_verified = true);

-- Create policies for creator_voice_fingerprints
CREATE POLICY "Users can insert own fingerprints"
ON creator_voice_fingerprints
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own fingerprints"
ON creator_voice_fingerprints
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own fingerprints"
ON creator_voice_fingerprints
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fingerprints"
ON creator_voice_fingerprints
FOR DELETE
USING (auth.uid() = user_id);