-- Fix infinite recursion in trucking_loads RLS policy
-- The issue is the policy references trucking_load_shares which references trucking_loads

-- First, create a security definer function to check if a load is shared with a user
CREATE OR REPLACE FUNCTION public.is_load_shared_with_user(_load_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trucking_load_shares
    WHERE load_id = _load_id AND shared_with_user_id = _user_id
  )
$$;

-- Create function to check if user can edit shared load
CREATE OR REPLACE FUNCTION public.can_edit_shared_load(_load_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trucking_load_shares
    WHERE load_id = _load_id 
    AND shared_with_user_id = _user_id 
    AND can_edit = true
  )
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "trucking_loads_select_own_or_shared" ON public.trucking_loads;
DROP POLICY IF EXISTS "trucking_loads_update_own_or_shared" ON public.trucking_loads;

-- Recreate policies using the security definer functions
CREATE POLICY "trucking_loads_select_own_or_shared" 
ON public.trucking_loads 
FOR SELECT 
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_load_shared_with_user(id, auth.uid())
);

CREATE POLICY "trucking_loads_update_own_or_shared" 
ON public.trucking_loads 
FOR UPDATE 
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.can_edit_shared_load(id, auth.uid())
);