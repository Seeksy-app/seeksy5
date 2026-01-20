-- Allow board_admin and super_admin to delete any board meetings
DROP POLICY IF EXISTS "Board admins can delete meetings" ON public.board_meetings;

CREATE POLICY "Board admins can delete meetings"
ON public.board_meetings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'board_admin', 'admin')
  )
);