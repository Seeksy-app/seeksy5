-- Add missing columns to meeting_recordings
ALTER TABLE public.meeting_recordings 
ADD COLUMN IF NOT EXISTS daily_recording_id TEXT,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- Add guest columns to meeting_participants
ALTER TABLE public.meeting_participants
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meetings_room_name ON public.meetings(room_name);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting ON public.meeting_recordings(meeting_id);
