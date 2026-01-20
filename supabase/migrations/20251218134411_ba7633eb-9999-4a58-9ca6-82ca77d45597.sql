-- Add soft delete columns to trucking_call_logs
ALTER TABLE public.trucking_call_logs 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_deleted_at 
ON public.trucking_call_logs(deleted_at) 
WHERE deleted_at IS NULL;

-- Add unique constraint on elevenlabs_conversation_id (allows null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trucking_call_logs_elevenlabs_conv_id 
ON public.trucking_call_logs(elevenlabs_conversation_id) 
WHERE elevenlabs_conversation_id IS NOT NULL;

-- Add index on elevenlabs_agent_id for filtering
CREATE INDEX IF NOT EXISTS idx_trucking_call_logs_agent_id 
ON public.trucking_call_logs(elevenlabs_agent_id);