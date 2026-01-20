-- Add start_time column to board_meeting_notes
ALTER TABLE board_meeting_notes 
ADD COLUMN start_time time DEFAULT '10:00:00';