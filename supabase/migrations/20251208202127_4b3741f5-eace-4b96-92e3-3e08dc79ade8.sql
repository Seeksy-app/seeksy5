-- Fix RLS policies for proforma_versions to allow users to save versions
-- Drop existing policies and recreate with proper user-based access

DROP POLICY IF EXISTS "Admins can manage proforma versions" ON public.proforma_versions;
DROP POLICY IF EXISTS "Board members can view proforma versions" ON public.proforma_versions;

-- Allow authenticated users to view their own versions
CREATE POLICY "Users can view their own proforma versions"
ON public.proforma_versions
FOR SELECT
USING (created_by = auth.uid());

-- Allow admins/CFO to view all versions
CREATE POLICY "Admins can view all proforma versions"
ON public.proforma_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'cfo', 'board_member')
  )
);

-- Allow authenticated users to insert their own versions
CREATE POLICY "Users can create proforma versions"
ON public.proforma_versions
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Allow users to update their own versions
CREATE POLICY "Users can update their own proforma versions"
ON public.proforma_versions
FOR UPDATE
USING (created_by = auth.uid());

-- Allow users to delete their own versions
CREATE POLICY "Users can delete their own proforma versions"
ON public.proforma_versions
FOR DELETE
USING (created_by = auth.uid());

-- Allow admins to manage all versions
CREATE POLICY "Admins can manage all proforma versions"
ON public.proforma_versions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'cfo')
  )
);