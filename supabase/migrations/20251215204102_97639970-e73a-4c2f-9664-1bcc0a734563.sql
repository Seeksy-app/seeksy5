-- Add UPDATE policy for board_meeting_notes so board members can update their own meetings
CREATE POLICY "board_members_update_own_meeting_notes"
ON public.board_meeting_notes
FOR UPDATE
USING (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (created_by = auth.uid()) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);