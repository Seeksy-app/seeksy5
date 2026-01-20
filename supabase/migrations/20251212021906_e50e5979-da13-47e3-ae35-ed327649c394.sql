-- Drop existing owner-only policy
DROP POLICY IF EXISTS "trucking_loads_owner_access" ON public.trucking_loads;

-- Create new policies for team-wide visibility
-- All authenticated users can view all loads
CREATE POLICY "trucking_loads_select_all" 
ON public.trucking_loads 
FOR SELECT 
TO authenticated
USING (true);

-- Users can insert their own loads
CREATE POLICY "trucking_loads_insert_own" 
ON public.trucking_loads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Users can update/delete any load (team access)
CREATE POLICY "trucking_loads_update_all" 
ON public.trucking_loads 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "trucking_loads_delete_all" 
ON public.trucking_loads 
FOR DELETE 
TO authenticated
USING (true);