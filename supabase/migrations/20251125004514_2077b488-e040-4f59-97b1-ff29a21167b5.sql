-- Add podcasts_enabled column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS podcasts_enabled BOOLEAN DEFAULT false;