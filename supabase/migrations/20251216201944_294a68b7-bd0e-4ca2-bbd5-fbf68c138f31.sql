-- Add policy to allow public lookup of meetings (for guest token-based access)
-- This is needed for guests to see meeting details without authentication
CREATE POLICY "Public can read meetings"
ON public.board_meeting_notes
FOR SELECT
USING (true);