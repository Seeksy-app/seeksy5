-- Drop and recreate UPDATE policy to include board_member role
DROP POLICY IF EXISTS board_members_update_own_meeting_notes ON public.board_meeting_notes;

CREATE POLICY "board_members_can_update_meeting_notes" 
ON public.board_meeting_notes 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'board_member'::app_role) OR
  has_role(auth.uid(), 'board_admin'::app_role) OR
  created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'board_member'::app_role) OR
  has_role(auth.uid(), 'board_admin'::app_role) OR
  created_by = auth.uid()
);