-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.lead_workspaces;
DROP POLICY IF EXISTS "Members can view their memberships" ON public.lead_workspace_memberships;

-- Create a security definer function to check workspace membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_lead_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lead_workspace_memberships 
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
$$;

-- Create a security definer function to check workspace ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_lead_workspace_owner(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lead_workspaces 
    WHERE id = p_workspace_id AND owner_user_id = p_user_id
  );
$$;

-- Recreate lead_workspaces SELECT policy using the function
CREATE POLICY "Users can view their own workspaces" 
ON public.lead_workspaces 
FOR SELECT 
USING (
  owner_user_id = auth.uid() 
  OR public.is_lead_workspace_member(id, auth.uid())
);

-- Recreate lead_workspace_memberships SELECT policy using the function  
CREATE POLICY "Members can view their memberships" 
ON public.lead_workspace_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR public.is_lead_workspace_owner(workspace_id, auth.uid())
);