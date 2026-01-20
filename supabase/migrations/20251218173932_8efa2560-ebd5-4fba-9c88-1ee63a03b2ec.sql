-- Add comprehensive ElevenLabs metadata fields to trucking_call_logs
-- These capture all available call data from ElevenLabs conversational AI API

-- Twilio / Telephony integration fields
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT;
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS twilio_stream_sid TEXT;

-- Phone data - receiver_number for outbound calls
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS receiver_number TEXT;

-- Connection and timing
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS connection_duration_seconds INTEGER;

-- Audio metadata
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS has_user_audio BOOLEAN DEFAULT FALSE;
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS has_response_audio BOOLEAN DEFAULT FALSE;

-- Branch versioning
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- User tracking from ElevenLabs
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS elevenlabs_user_id TEXT;

-- Full metadata blob for any additional fields
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS elevenlabs_metadata JSONB;

-- Analysis data from ElevenLabs
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS analysis_summary TEXT;
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS call_successful BOOLEAN;
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS data_collection_results JSONB;

-- Conversation initiation client data (dynamic variables passed at start)
ALTER TABLE public.trucking_call_logs ADD COLUMN IF NOT EXISTS initiation_client_data JSONB;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_call_started_at ON public.trucking_call_logs(call_started_at);
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_twilio_call_sid ON public.trucking_call_logs(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_call_direction ON public.trucking_call_logs(call_direction);

-- Add comment for documentation
COMMENT ON COLUMN public.trucking_call_logs.twilio_call_sid IS 'Twilio Call SID for telephony integration';
COMMENT ON COLUMN public.trucking_call_logs.twilio_stream_sid IS 'Twilio Stream SID for audio streaming';
COMMENT ON COLUMN public.trucking_call_logs.receiver_number IS 'Destination phone number for outbound calls';
COMMENT ON COLUMN public.trucking_call_logs.connection_duration_seconds IS 'Time from connection to call end';
COMMENT ON COLUMN public.trucking_call_logs.elevenlabs_metadata IS 'Full metadata object from ElevenLabs API';
COMMENT ON COLUMN public.trucking_call_logs.data_collection_results IS 'Structured data collected during the call';
COMMENT ON COLUMN public.trucking_call_logs.initiation_client_data IS 'Dynamic variables passed at conversation start';