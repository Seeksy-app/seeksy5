-- Add meeting_agenda column to board_meeting_notes table
ALTER TABLE public.board_meeting_notes 
ADD COLUMN IF NOT EXISTS meeting_agenda TEXT;