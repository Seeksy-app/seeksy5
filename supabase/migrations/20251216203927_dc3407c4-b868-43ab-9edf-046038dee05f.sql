-- Drop existing policy and recreate with board_admin included
DROP POLICY IF EXISTS "Board admin manage decisions" ON public.board_decisions;

CREATE POLICY "Board admin manage decisions" 
ON public.board_decisions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'board_admin'::app_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'board_admin'::app_role])
  )
);