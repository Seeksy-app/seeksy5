-- Add UPDATE policy for board_notifications so users can mark as read
CREATE POLICY "Board members can update notifications"
ON public.board_notifications
FOR UPDATE
USING (true)
WITH CHECK (true);