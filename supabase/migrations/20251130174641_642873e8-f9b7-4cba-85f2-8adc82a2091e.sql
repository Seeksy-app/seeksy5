-- Fix Function Search Path Mutable warnings by setting search_path on core public functions

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_user_roles(_user_id uuid) SET search_path = public;
ALTER FUNCTION public.has_permission(_user_id uuid, _permission text) SET search_path = public;
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = public;
ALTER FUNCTION public.is_adm() SET search_path = public;
ALTER FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid) SET search_path = public;
ALTER FUNCTION public.has_multiple_roles(_user_id uuid) SET search_path = public;

-- Fix RLS on episodes table - require authentication for episode visibility
DROP POLICY IF EXISTS "Users can view their own episodes" ON episodes;
CREATE POLICY "Users can view their own episodes"
  ON episodes FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM podcasts WHERE id = episodes.podcast_id
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Fix RLS on profiles table - require authentication to view profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);