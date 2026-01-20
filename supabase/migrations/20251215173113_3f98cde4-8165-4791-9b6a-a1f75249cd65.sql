-- =====================================================
-- BOARD MEETING NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.board_meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  meeting_date date NOT NULL,
  agenda_items jsonb NOT NULL DEFAULT '[]',
  memo jsonb,
  decision_table jsonb NOT NULL DEFAULT '[]',
  decisions_summary text,
  decisions_summary_generated_at timestamptz,
  decisions_summary_locked boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_meeting_notes_date ON public.board_meeting_notes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_board_meeting_notes_status ON public.board_meeting_notes(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_board_meeting_notes_updated_at ON public.board_meeting_notes;
CREATE TRIGGER trg_board_meeting_notes_updated_at BEFORE UPDATE ON public.board_meeting_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.board_meeting_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies - board members only
CREATE POLICY "board_members_view_meeting_notes" ON public.board_meeting_notes
FOR SELECT USING (
  has_role(auth.uid(), 'board_member'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "board_admins_manage_meeting_notes" ON public.board_meeting_notes
FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);