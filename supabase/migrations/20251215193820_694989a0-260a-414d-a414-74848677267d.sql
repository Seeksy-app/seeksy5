-- Drop old constraint and add new one with 'upcoming'
ALTER TABLE board_meeting_notes DROP CONSTRAINT IF EXISTS board_meeting_notes_status_check;
ALTER TABLE board_meeting_notes ADD CONSTRAINT board_meeting_notes_status_check 
  CHECK (status = ANY (ARRAY['draft', 'upcoming', 'active', 'completed', 'archived']));