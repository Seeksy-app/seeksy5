-- Add member_notes column for storing per-member notes keyed by user_id
ALTER TABLE board_meeting_notes 
ADD COLUMN IF NOT EXISTS member_notes JSONB DEFAULT '{}'::jsonb;