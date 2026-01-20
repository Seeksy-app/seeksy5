-- Update default voice to Jessica (female)
ALTER TABLE public.trucking_settings 
  ALTER COLUMN elevenlabs_voice_id SET DEFAULT 'cgSgspJ2msm6clMCkdW9',
  ALTER COLUMN elevenlabs_voice_name SET DEFAULT 'Jessica',
  ALTER COLUMN ai_caller_name SET DEFAULT 'Jessica',
  ALTER COLUMN ai_opening_message SET DEFAULT 'Hi, this is Jessica from D and L Transport. How can I help you today?';

-- Update any existing records with the old voice ID
UPDATE public.trucking_settings
SET 
  elevenlabs_voice_id = 'cgSgspJ2msm6clMCkdW9',
  elevenlabs_voice_name = 'Jessica',
  ai_caller_name = 'Jessica',
  ai_opening_message = 'Hi, this is Jessica from D and L Transport. How can I help you today?'
WHERE elevenlabs_voice_id = '09AoN6tYyW3VSTQqCo7C' OR elevenlabs_voice_id IS NULL;