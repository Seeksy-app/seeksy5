-- Create table to store AI call transcripts for learning and analytics
CREATE TABLE IF NOT EXISTS public.trucking_call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id uuid REFERENCES public.trucking_call_logs(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  load_id uuid REFERENCES public.trucking_loads(id) ON DELETE SET NULL,
  caller_phone text,
  transcript_text text NOT NULL,
  summary text,
  sentiment text,
  key_topics text[],
  negotiation_outcome text,
  rate_discussed numeric,
  duration_seconds integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.trucking_call_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies for transcript access
CREATE POLICY "trucking_call_transcripts_select_own" 
ON public.trucking_call_transcripts 
FOR SELECT 
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "trucking_call_transcripts_insert_own" 
ON public.trucking_call_transcripts 
FOR INSERT 
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow service role full access for edge functions
CREATE POLICY "trucking_call_transcripts_service_role" 
ON public.trucking_call_transcripts 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trucking_call_transcripts_owner ON public.trucking_call_transcripts(owner_id);
CREATE INDEX IF NOT EXISTS idx_trucking_call_transcripts_load ON public.trucking_call_transcripts(load_id);
CREATE INDEX IF NOT EXISTS idx_trucking_call_transcripts_created ON public.trucking_call_transcripts(created_at DESC);