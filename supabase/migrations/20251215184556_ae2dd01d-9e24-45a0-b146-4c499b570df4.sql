-- Add missing columns to board_meeting_notes table
ALTER TABLE public.board_meeting_notes 
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 45,
ADD COLUMN IF NOT EXISTS member_questions jsonb DEFAULT '[]'::jsonb;