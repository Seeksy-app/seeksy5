-- Add studio_theme column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS studio_theme TEXT CHECK (studio_theme IN ('light', 'dark')) DEFAULT 'light';

-- Add index for faster theme lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_studio_theme 
ON user_preferences(user_id, studio_theme);