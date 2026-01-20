-- Add task_view_mode column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS task_view_mode TEXT DEFAULT 'board' CHECK (task_view_mode IN ('board', 'list'));