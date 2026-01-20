-- Drop existing restrictive delete policy
DROP POLICY IF EXISTS "users_delete_own_meeting_notes" ON public.board_meeting_notes;

-- Create a new permissive delete policy that allows board members to delete
CREATE POLICY "board_members_can_delete_meeting_notes"
ON public.board_meeting_notes
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'board_member'::app_role) OR
  has_role(auth.uid(), 'board_admin'::app_role) OR
  created_by = auth.uid()
);