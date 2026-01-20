-- Board Meetings main table
CREATE TABLE public.board_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'canceled')),
  location TEXT,
  virtual_link TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_meetings_starts_at ON public.board_meetings(starts_at);
CREATE INDEX idx_board_meetings_status ON public.board_meetings(status);

-- Board Meeting Content (agenda, memo, notes, decisions)
CREATE TABLE public.board_meeting_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  initial_agenda_md TEXT,
  ai_agenda_md TEXT,
  board_memo_md TEXT,
  meeting_notes_md TEXT,
  decision_table_json JSONB,
  post_meeting_decisions_summary_md TEXT,
  agenda_checklist_json JSONB,
  meeting_notes_checklist_json JSONB,
  agenda_runofshow_json JSONB,
  agenda_session_state_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id)
);

CREATE INDEX idx_board_meeting_content_meeting_id ON public.board_meeting_content(meeting_id);

-- Board Meeting Member Notes (per member per meeting)
CREATE TABLE public.board_meeting_member_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL,
  notes_md TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, member_user_id)
);

CREATE INDEX idx_board_meeting_member_notes_meeting_id ON public.board_meeting_member_notes(meeting_id);
CREATE INDEX idx_board_meeting_member_notes_member ON public.board_meeting_member_notes(member_user_id);

-- Board Meeting Attachments
CREATE TABLE public.board_meeting_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  file_url TEXT,
  link_url TEXT,
  type TEXT NOT NULL DEFAULT 'file' CHECK (type IN ('file', 'link')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_meeting_attachments_meeting_id ON public.board_meeting_attachments(meeting_id);

-- Enable RLS
ALTER TABLE public.board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_meeting_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_meeting_member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_meeting_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_meetings
CREATE POLICY "Board members and admins can read meetings"
  ON public.board_meetings FOR SELECT
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['board_member', 'admin', 'super_admin'])
  );

CREATE POLICY "Admins can insert meetings"
  ON public.board_meetings FOR INSERT
  WITH CHECK (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can update meetings"
  ON public.board_meetings FOR UPDATE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can delete meetings"
  ON public.board_meetings FOR DELETE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

-- RLS Policies for board_meeting_content
CREATE POLICY "Board members and admins can read content"
  ON public.board_meeting_content FOR SELECT
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['board_member', 'admin', 'super_admin'])
  );

CREATE POLICY "Admins can insert content"
  ON public.board_meeting_content FOR INSERT
  WITH CHECK (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can update content"
  ON public.board_meeting_content FOR UPDATE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can delete content"
  ON public.board_meeting_content FOR DELETE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

-- RLS Policies for board_meeting_member_notes
CREATE POLICY "Board members can read own notes"
  ON public.board_meeting_member_notes FOR SELECT
  USING (
    member_user_id = auth.uid() OR
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Board members can insert own notes"
  ON public.board_meeting_member_notes FOR INSERT
  WITH CHECK (
    member_user_id = auth.uid() AND
    public.user_has_any_role(auth.uid(), ARRAY['board_member', 'admin', 'super_admin'])
  );

CREATE POLICY "Board members can update own notes"
  ON public.board_meeting_member_notes FOR UPDATE
  USING (
    member_user_id = auth.uid() OR
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can delete member notes"
  ON public.board_meeting_member_notes FOR DELETE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

-- RLS Policies for board_meeting_attachments
CREATE POLICY "Board members and admins can read attachments"
  ON public.board_meeting_attachments FOR SELECT
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['board_member', 'admin', 'super_admin'])
  );

CREATE POLICY "Admins can insert attachments"
  ON public.board_meeting_attachments FOR INSERT
  WITH CHECK (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can update attachments"
  ON public.board_meeting_attachments FOR UPDATE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Admins can delete attachments"
  ON public.board_meeting_attachments FOR DELETE
  USING (
    public.user_has_any_role(auth.uid(), ARRAY['admin', 'super_admin'])
  );

-- Trigger for updated_at
CREATE TRIGGER update_board_meetings_updated_at
  BEFORE UPDATE ON public.board_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_meeting_content_updated_at
  BEFORE UPDATE ON public.board_meeting_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_board_meeting_member_notes_updated_at
  BEFORE UPDATE ON public.board_meeting_member_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();