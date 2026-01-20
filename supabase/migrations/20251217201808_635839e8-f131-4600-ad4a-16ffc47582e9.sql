-- First, drop the problematic policies
DROP POLICY IF EXISTS "Super admins can manage admin users" ON trucking_admin_users;
DROP POLICY IF EXISTS "Admin users can view admin users" ON trucking_admin_users;

-- Create a security definer function to check if user is a trucking super admin
CREATE OR REPLACE FUNCTION public.is_trucking_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trucking_admin_users
    WHERE user_id = check_user_id
      AND role = 'super_admin'
  )
$$;

-- Create a security definer function to check if user is any trucking admin
CREATE OR REPLACE FUNCTION public.is_trucking_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trucking_admin_users
    WHERE user_id = check_user_id
  )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Admin users can view admin users" 
ON trucking_admin_users 
FOR SELECT 
USING (public.is_trucking_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users" 
ON trucking_admin_users 
FOR ALL 
USING (public.is_trucking_super_admin(auth.uid()));

-- Also fix the same pattern on other trucking admin tables
DROP POLICY IF EXISTS "Admin users can view rate preferences" ON trucking_rate_preferences;
DROP POLICY IF EXISTS "Super admins can manage rate preferences" ON trucking_rate_preferences;

CREATE POLICY "Admin users can view rate preferences" 
ON trucking_rate_preferences 
FOR SELECT 
USING (public.is_trucking_admin(auth.uid()));

CREATE POLICY "Super admins can manage rate preferences" 
ON trucking_rate_preferences 
FOR ALL 
USING (public.is_trucking_super_admin(auth.uid()));

-- Fix agents table policies
DROP POLICY IF EXISTS "Admin users can view agents" ON trucking_agents;
DROP POLICY IF EXISTS "Super admins can manage agents" ON trucking_agents;

CREATE POLICY "Admin users can view agents" 
ON trucking_agents 
FOR SELECT 
USING (public.is_trucking_admin(auth.uid()));

CREATE POLICY "Super admins can manage agents" 
ON trucking_agents 
FOR ALL 
USING (public.is_trucking_super_admin(auth.uid()));