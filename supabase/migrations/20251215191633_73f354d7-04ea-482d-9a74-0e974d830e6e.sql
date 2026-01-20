-- Add delete policy for meeting notes (creators can delete their own, admins can delete any)
CREATE POLICY "users_delete_own_meeting_notes" 
ON board_meeting_notes
FOR DELETE 
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'super_admin'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);