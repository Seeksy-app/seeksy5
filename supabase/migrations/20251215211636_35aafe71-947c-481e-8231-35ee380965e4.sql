-- Add Daily.co video meeting fields to board_meeting_notes
ALTER TABLE public.board_meeting_notes 
ADD COLUMN IF NOT EXISTS room_name TEXT,
ADD COLUMN IF NOT EXISTS room_url TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS audio_transcript TEXT;

-- Add index for active video rooms
CREATE INDEX IF NOT EXISTS idx_board_meeting_notes_room_name 
ON public.board_meeting_notes(room_name) 
WHERE room_name IS NOT NULL;