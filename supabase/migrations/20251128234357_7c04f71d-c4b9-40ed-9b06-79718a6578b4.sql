-- Add auto-transcribe setting to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS auto_transcribe_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_preferences.auto_transcribe_enabled IS 'Auto-generate transcripts from Studio recordings';
