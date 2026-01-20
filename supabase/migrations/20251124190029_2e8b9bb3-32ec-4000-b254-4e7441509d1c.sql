-- Drop the problematic recursive policies and replace with simpler ones
DROP POLICY IF EXISTS "Super admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete user roles" ON public.user_roles;

-- Users can always view their own roles (no recursion)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Super admins can view all roles (using the has_role function which is SECURITY DEFINER)
CREATE POLICY "Super admins can view all user roles v2"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can manage all roles
CREATE POLICY "Super admins can insert user roles v2"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update user roles v2"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete user roles v2"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));