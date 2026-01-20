-- Phase 4: Board Meeting Invites + Host Gate + Host Tabs

-- A) Create board_meeting_invites table
CREATE TABLE public.board_meeting_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.board_meeting_notes(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  role TEXT DEFAULT 'board_member',
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'accepted', 'declined')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for board_meeting_invites
CREATE INDEX idx_board_meeting_invites_meeting_id ON public.board_meeting_invites(meeting_id);
CREATE INDEX idx_board_meeting_invites_email ON public.board_meeting_invites(invitee_email);
CREATE INDEX idx_board_meeting_invites_token ON public.board_meeting_invites(invite_token);

-- Enable RLS
ALTER TABLE public.board_meeting_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for board_meeting_invites
CREATE POLICY "Admins can manage all invites" ON public.board_meeting_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'board_member'))
  );

CREATE POLICY "Invitees can view their own invites" ON public.board_meeting_invites
  FOR SELECT USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- B) Add host gate fields to board_meeting_notes
ALTER TABLE public.board_meeting_notes 
  ADD COLUMN IF NOT EXISTS host_has_started BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES auth.users(id);

-- C) Create board_meeting_whiteboard table for whiteboard content
CREATE TABLE public.board_meeting_whiteboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.board_meeting_notes(id) ON DELETE CASCADE,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for whiteboard
ALTER TABLE public.board_meeting_whiteboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board members can access whiteboards" ON public.board_meeting_whiteboard
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'board_member'))
  );

-- Trigger for updated_at
CREATE TRIGGER update_board_meeting_whiteboard_updated_at
  BEFORE UPDATE ON public.board_meeting_whiteboard
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- F) Add carry_forward_source_id to track where items came from
ALTER TABLE public.board_meeting_notes 
  ADD COLUMN IF NOT EXISTS carry_forward_source_id UUID REFERENCES public.board_meeting_notes(id);

ALTER TABLE public.board_decisions 
  ADD COLUMN IF NOT EXISTS carried_from_meeting_id UUID REFERENCES public.board_meeting_notes(id);