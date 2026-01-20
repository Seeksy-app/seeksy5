-- Drop existing problematic policies on team_members
DROP POLICY IF EXISTS "Advertiser admins can view team members" ON advertiser_team_members;
DROP POLICY IF EXISTS "Advertiser super_admins can add team members" ON advertiser_team_members;
DROP POLICY IF EXISTS "Advertiser super_admins can delete team members" ON advertiser_team_members;
DROP POLICY IF EXISTS "Advertiser super_admins can update team members" ON advertiser_team_members;

-- Create security definer function to check if user is team admin/owner
CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams
    WHERE id = _team_id
      AND owner_id = _user_id
  )
$$;

-- Drop existing problematic policies on team_members
DROP POLICY IF EXISTS "Team owners can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can add team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can delete team members" ON team_members;

-- Recreate policies using security definer functions
CREATE POLICY "Team owners can view their team members"
ON public.team_members
FOR SELECT
USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can add team members"
ON public.team_members
FOR INSERT
WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can update team members"
ON public.team_members
FOR UPDATE
USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can delete team members"
ON public.team_members
FOR DELETE
USING (public.is_team_owner(auth.uid(), team_id));

-- Also fix team_invitations policies if they exist
DROP POLICY IF EXISTS "Team owners can view invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can delete invitations" ON team_invitations;

CREATE POLICY "Team owners can view invitations"
ON public.team_invitations
FOR SELECT
USING (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Team owners can delete invitations"
ON public.team_invitations
FOR DELETE
USING (public.is_team_owner(auth.uid(), team_id));