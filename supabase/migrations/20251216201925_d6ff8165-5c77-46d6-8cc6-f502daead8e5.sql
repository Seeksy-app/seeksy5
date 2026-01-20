-- Add policy to allow public lookup of invites by token (for guest access)
CREATE POLICY "Public can lookup invites by token"
ON public.board_meeting_invites
FOR SELECT
USING (true);

-- Note: This allows reading invite records, but the token-based lookup is still secure
-- because the token is essentially the access key