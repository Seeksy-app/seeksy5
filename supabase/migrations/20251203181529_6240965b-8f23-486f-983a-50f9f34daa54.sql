-- Drop existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create new comprehensive SELECT policy for profiles
-- Allows: own profile, admin access to all, public profiles viewable by anyone
CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  -- Users can read their own profile
  id = auth.uid()
  OR
  -- Admins and super_admins can read any profile
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
  OR
  -- Public profiles are viewable by anyone (including anonymous)
  is_public = true
);