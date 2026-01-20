-- Create veteran_conversations table for chat history
CREATE TABLE public.veteran_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  context_json JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create veteran_chat_messages table for individual messages
CREATE TABLE public.veteran_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.veteran_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  quick_replies JSONB,
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veteran_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veteran_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for veteran_conversations
CREATE POLICY "Users can view their own conversations" ON public.veteran_conversations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON public.veteran_conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.veteran_conversations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.veteran_conversations 
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for veteran_chat_messages
CREATE POLICY "Users can view messages in their conversations" ON public.veteran_chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.veteran_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert messages in their conversations" ON public.veteran_chat_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.veteran_conversations 
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_veteran_conversations_user_id ON public.veteran_conversations(user_id);
CREATE INDEX idx_veteran_conversations_last_message ON public.veteran_conversations(last_message_at DESC);
CREATE INDEX idx_veteran_chat_messages_conversation_id ON public.veteran_chat_messages(conversation_id);