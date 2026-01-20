-- Meeting participants tracking
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  guest_name TEXT,
  guest_email TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'co-host', 'guest')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'in-meeting', 'left', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting chat messages
CREATE TABLE IF NOT EXISTS public.meeting_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting recordings
CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add room_name to meetings table for Daily.co integration
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS room_name TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS room_url TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS waiting_room_enabled BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_participants
CREATE POLICY "Meeting hosts can manage participants" ON public.meeting_participants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid())
  );

CREATE POLICY "Participants can view their own record" ON public.meeting_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can join as participant" ON public.meeting_participants
  FOR INSERT WITH CHECK (true);

-- RLS Policies for meeting_chat_messages
CREATE POLICY "Meeting participants can view chat" ON public.meeting_chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_chat_messages.meeting_id AND (user_id = auth.uid() OR guest_email IS NOT NULL))
  );

CREATE POLICY "Authenticated users can send messages" ON public.meeting_chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can send chat messages" ON public.meeting_chat_messages
  FOR INSERT WITH CHECK (true);

-- RLS Policies for meeting_recordings
CREATE POLICY "Meeting hosts can manage recordings" ON public.meeting_recordings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid())
  );

CREATE POLICY "Participants can view recordings" ON public.meeting_recordings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.meeting_participants WHERE meeting_id = meeting_recordings.meeting_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_chat_messages_meeting_id ON public.meeting_chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting_id ON public.meeting_recordings(meeting_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;