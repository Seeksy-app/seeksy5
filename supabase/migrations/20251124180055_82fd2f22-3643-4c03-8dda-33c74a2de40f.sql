-- Add my_page_visited column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS my_page_visited BOOLEAN DEFAULT FALSE;