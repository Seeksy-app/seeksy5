-- Fix RLS policy for investor_links to properly allow inserts
DROP POLICY IF EXISTS "Admins can manage investor links" ON public.investor_links;

-- Create separate policies for each operation
CREATE POLICY "Admins can select investor links" ON public.investor_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin', 'board_member')
    )
  );

CREATE POLICY "Admins can insert investor links" ON public.investor_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin', 'board_member')
    )
  );

CREATE POLICY "Admins can update investor links" ON public.investor_links
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin', 'board_member')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin', 'board_member')
    )
  );

CREATE POLICY "Admins can delete investor links" ON public.investor_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin', 'board_member')
    )
  );