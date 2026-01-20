-- Add engagement tracking columns to trucking_calls
ALTER TABLE public.trucking_calls 
ADD COLUMN IF NOT EXISTS call_duration_seconds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS time_to_handoff_seconds integer;

-- Add index for engagement queries
CREATE INDEX IF NOT EXISTS idx_trucking_calls_duration ON public.trucking_calls(call_duration_seconds);

COMMENT ON COLUMN public.trucking_calls.call_duration_seconds IS 'Call duration in seconds from ElevenLabs';
COMMENT ON COLUMN public.trucking_calls.audio_url IS 'URL to call recording audio';
COMMENT ON COLUMN public.trucking_calls.time_to_handoff_seconds IS 'Seconds until caller requested handoff/agent';