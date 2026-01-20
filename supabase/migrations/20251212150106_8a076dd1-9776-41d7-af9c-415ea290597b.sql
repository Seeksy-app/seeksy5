-- Drop existing restrictive policies on trucking_carrier_leads
DROP POLICY IF EXISTS "trucking_leads_owner_access" ON public.trucking_carrier_leads;
DROP POLICY IF EXISTS "trucking_leads_update" ON public.trucking_carrier_leads;
DROP POLICY IF EXISTS "trucking_leads_delete" ON public.trucking_carrier_leads;

-- Create new policies that allow all authenticated users to see all leads (team-wide visibility)
CREATE POLICY "trucking_leads_select_all"
ON public.trucking_carrier_leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "trucking_leads_update_all"
ON public.trucking_carrier_leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "trucking_leads_delete_all"
ON public.trucking_carrier_leads
FOR DELETE
TO authenticated
USING (true);

-- Also fix trucking_call_logs for team-wide visibility
DROP POLICY IF EXISTS "trucking_call_logs_owner_access" ON public.trucking_call_logs;

CREATE POLICY "trucking_call_logs_select_all"
ON public.trucking_call_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "trucking_call_logs_update_all"
ON public.trucking_call_logs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "trucking_call_logs_delete_all"
ON public.trucking_call_logs
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "trucking_call_logs_insert_all"
ON public.trucking_call_logs
FOR INSERT
TO authenticated
WITH CHECK (true);