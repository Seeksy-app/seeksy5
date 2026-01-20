-- Create inbox_messages table for storing received emails from Gmail
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_address TEXT,
  subject TEXT NOT NULL DEFAULT '(No Subject)',
  snippet TEXT,
  body_html TEXT,
  body_text TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  email_account TEXT,
  labels TEXT[] DEFAULT '{}',
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_message_id)
);

-- Enable RLS
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own inbox messages"
ON public.inbox_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inbox messages"
ON public.inbox_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inbox messages"
ON public.inbox_messages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inbox messages"
ON public.inbox_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_inbox_messages_user_id ON public.inbox_messages(user_id);
CREATE INDEX idx_inbox_messages_received_at ON public.inbox_messages(received_at DESC);
CREATE INDEX idx_inbox_messages_gmail_id ON public.inbox_messages(gmail_message_id);
CREATE INDEX idx_inbox_messages_is_read ON public.inbox_messages(user_id, is_read);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_inbox_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inbox_messages_updated_at
BEFORE UPDATE ON public.inbox_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_inbox_messages_updated_at();