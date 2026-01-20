-- Add ElevenLabs tracking columns to trucking_call_logs
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT,
ADD COLUMN IF NOT EXISTS call_cost_credits INTEGER,
ADD COLUMN IF NOT EXISTS call_cost_usd NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS llm_cost_usd_total NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS llm_cost_usd_per_min NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS ended_reason TEXT,
ADD COLUMN IF NOT EXISTS call_status TEXT;

-- Create unique index on elevenlabs_conversation_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_trucking_call_logs_elevenlabs_conv_id 
ON public.trucking_call_logs (elevenlabs_conversation_id) 
WHERE elevenlabs_conversation_id IS NOT NULL;

-- Create index for agent filtering
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_elevenlabs_agent 
ON public.trucking_call_logs (elevenlabs_agent_id);