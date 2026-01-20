-- Add policy allowing users to view their own created meetings
CREATE POLICY "users_view_own_meeting_notes" 
ON public.board_meeting_notes 
FOR SELECT 
USING (created_by = auth.uid());