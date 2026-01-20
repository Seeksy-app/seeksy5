-- Create email_replies table for tracking replies to sent emails
CREATE TABLE IF NOT EXISTS public.email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_event_id UUID NOT NULL REFERENCES public.email_events(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE, -- For deduplication
  from_address TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  snippet TEXT, -- First 160 chars of reply body
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  thread_id TEXT, -- Gmail thread ID for grouping
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view replies to their own sent emails
CREATE POLICY "Users can view replies to their own emails"
  ON public.email_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_events
      WHERE email_events.id = email_replies.email_event_id
      AND email_events.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_email_replies_email_event_id ON public.email_replies(email_event_id);
CREATE INDEX idx_email_replies_gmail_message_id ON public.email_replies(gmail_message_id);
CREATE INDEX idx_email_replies_received_at ON public.email_replies(received_at DESC);