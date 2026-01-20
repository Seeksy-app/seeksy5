-- Drop all existing SELECT policies on profiles to clean up
DROP POLICY IF EXISTS "Owner can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "own_profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;

-- Create a single, consolidated SELECT policy
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  -- 1. Owner can always read their own profile
  id = auth.uid()
  -- 2. Admins can read any profile
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  -- 3. Public profiles are viewable by anyone
  OR is_public = true
);

-- Ensure UPDATE policies are consolidated too
DROP POLICY IF EXISTS "Owner can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own role preferences" ON public.profiles;

-- Single UPDATE policy for owners
CREATE POLICY "profiles_update_owner" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin UPDATE policy
CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Keep INSERT policy clean
DROP POLICY IF EXISTS "Owner can insert own profile" ON public.profiles;
CREATE POLICY "profiles_insert_owner" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());