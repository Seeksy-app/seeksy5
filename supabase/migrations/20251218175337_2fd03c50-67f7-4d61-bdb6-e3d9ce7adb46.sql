-- Create webhook events table for raw payload storage and idempotent processing
CREATE TABLE IF NOT EXISTS public.trucking_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elevenlabs_conversation_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'post_call',
  raw_payload JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  processing_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  call_log_id UUID REFERENCES public.trucking_call_logs(id),
  lead_id UUID REFERENCES public.trucking_carrier_leads(id),
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on conversation_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_conversation_id 
  ON public.trucking_webhook_events(elevenlabs_conversation_id);

-- Create index for processing queue
CREATE INDEX IF NOT EXISTS idx_webhook_events_pending 
  ON public.trucking_webhook_events(processing_status, processing_attempts, last_attempt_at)
  WHERE processing_status IN ('pending', 'failed');

-- Add missing fields to trucking_call_logs
ALTER TABLE public.trucking_call_logs 
  ADD COLUMN IF NOT EXISTS post_call_webhook_status TEXT,
  ADD COLUMN IF NOT EXISTS post_call_webhook_error TEXT,
  ADD COLUMN IF NOT EXISTS webhook_event_id UUID REFERENCES public.trucking_webhook_events(id);

-- Enable RLS on webhook events
ALTER TABLE public.trucking_webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role has full access to webhook events"
  ON public.trucking_webhook_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own webhook events
CREATE POLICY "Users can view own webhook events"
  ON public.trucking_webhook_events
  FOR SELECT
  USING (auth.uid() = owner_id);