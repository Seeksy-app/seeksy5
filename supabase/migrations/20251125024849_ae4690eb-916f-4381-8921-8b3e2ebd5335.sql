-- Drop ALL existing policies on team_members
DROP POLICY IF EXISTS "Admins can manage all team members" ON team_members;
DROP POLICY IF EXISTS "All authenticated users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team members can view themselves" ON team_members;
DROP POLICY IF EXISTS "Team owner can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON team_members;
DROP POLICY IF EXISTS "Team owners can add team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can delete team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage their team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON team_members;
DROP POLICY IF EXISTS "Team owners can update team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can view members" ON team_members;
DROP POLICY IF EXISTS "Team owners can view their team members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;

-- Create clean, simple policies using security definer function
CREATE POLICY "team_owners_select"
ON team_members FOR SELECT
USING (is_team_owner(auth.uid(), team_id));

CREATE POLICY "team_owners_insert"
ON team_members FOR INSERT
WITH CHECK (is_team_owner(auth.uid(), team_id));

CREATE POLICY "team_owners_update"
ON team_members FOR UPDATE
USING (is_team_owner(auth.uid(), team_id));

CREATE POLICY "team_owners_delete"
ON team_members FOR DELETE
USING (is_team_owner(auth.uid(), team_id));

-- Also allow members to view themselves
CREATE POLICY "members_view_self"
ON team_members FOR SELECT
USING (user_id = auth.uid());