-- Add meetings_enabled column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS meetings_enabled BOOLEAN DEFAULT true;