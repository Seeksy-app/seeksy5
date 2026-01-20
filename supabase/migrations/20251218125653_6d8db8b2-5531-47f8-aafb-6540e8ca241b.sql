-- Add ElevenLabs canonical ID columns to trucking_call_logs
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'elevenlabs';

-- Create unique index on elevenlabs_conversation_id (allows null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trucking_call_logs_elevenlabs_conversation_id 
ON public.trucking_call_logs (elevenlabs_conversation_id) 
WHERE elevenlabs_conversation_id IS NOT NULL;

-- Create index on elevenlabs_agent_id for filtering
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_elevenlabs_agent_id 
ON public.trucking_call_logs (elevenlabs_agent_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_created_at 
ON public.trucking_call_logs (created_at);