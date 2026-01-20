-- Add new voice/call settings columns to trucking_settings
ALTER TABLE public.trucking_settings 
ADD COLUMN IF NOT EXISTS ai_opening_message TEXT DEFAULT 'Hi, this is Jess from D and L Transport. How can I help you today?',
ADD COLUMN IF NOT EXISTS voicemail_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voicemail_transcribe BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voicemail_create_lead BOOLEAN DEFAULT true;

-- Update default voice config for existing rows
UPDATE public.trucking_settings 
SET 
  elevenlabs_voice_id = COALESCE(elevenlabs_voice_id, '09AoN6tYyW3VSTQqCo7C'),
  elevenlabs_voice_name = COALESCE(elevenlabs_voice_name, 'Jess'),
  max_concurrent_calls = COALESCE(max_concurrent_calls, 2),
  ai_caller_name = COALESCE(ai_caller_name, 'Jess'),
  ai_caller_company_name = COALESCE(ai_caller_company_name, 'D and L Transport')
WHERE elevenlabs_voice_id IS NULL;