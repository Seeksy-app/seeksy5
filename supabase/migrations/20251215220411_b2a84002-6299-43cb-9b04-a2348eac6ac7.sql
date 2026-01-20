-- Add guest_token column for shareable guest links
ALTER TABLE public.board_meeting_notes 
ADD COLUMN IF NOT EXISTS guest_token TEXT UNIQUE;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_board_meeting_notes_guest_token 
ON public.board_meeting_notes(guest_token) 
WHERE guest_token IS NOT NULL;