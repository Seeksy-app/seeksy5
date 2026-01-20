-- Drop all existing RLS policies for podcasts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'podcasts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON podcasts', r.policyname);
    END LOOP;
END$$;

-- Create correct policies using user_id
CREATE POLICY "Creators can view their own podcasts"
ON podcasts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert their own podcasts"
ON podcasts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update their own podcasts"
ON podcasts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Creators can delete their own podcasts"
ON podcasts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all podcasts"
ON podcasts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can manage all podcasts"
ON podcasts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);