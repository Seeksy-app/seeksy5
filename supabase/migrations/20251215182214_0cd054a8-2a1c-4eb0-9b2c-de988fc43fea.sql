-- Board Notes Module Enhancement (Fixed roles)

-- 1. Add missing columns to board_meetings
ALTER TABLE public.board_meetings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

-- Update existing records with platform tenant
UPDATE public.board_meetings 
SET tenant_id = 'a0000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE public.board_meetings 
ALTER COLUMN tenant_id SET NOT NULL;

-- 2. Board Agenda Items
CREATE TABLE IF NOT EXISTS public.board_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  timebox_minutes INTEGER NOT NULL DEFAULT 10,
  owner_user_id UUID,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Board Item Comments
CREATE TABLE IF NOT EXISTS public.board_item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES public.board_agenda_items(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('question', 'note')),
  phase TEXT NOT NULL CHECK (phase IN ('pre', 'during', 'post')),
  body TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Board Decisions
CREATE TABLE IF NOT EXISTS public.board_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES public.board_agenda_items(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT,
  decision TEXT,
  owner_user_id UUID,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Board Generated Outputs
CREATE TABLE IF NOT EXISTS public.board_generated_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  meeting_id UUID NOT NULL REFERENCES public.board_meetings(id) ON DELETE CASCADE,
  agenda_ai_json JSONB,
  board_memo_md TEXT,
  meeting_notes_md TEXT,
  decisions_summary_md TEXT,
  followup_plan_md TEXT,
  carryover_items_json JSONB,
  generated_at TIMESTAMPTZ,
  generated_by UUID,
  UNIQUE(meeting_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_board_meetings_tenant ON public.board_meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_board_agenda_items_meeting ON public.board_agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_board_item_comments_meeting ON public.board_item_comments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_board_item_comments_agenda ON public.board_item_comments(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_board_decisions_meeting ON public.board_decisions(meeting_id);

-- Enable RLS
ALTER TABLE public.board_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_generated_outputs ENABLE ROW LEVEL SECURITY;

-- Helper function for board access
CREATE OR REPLACE FUNCTION public.has_board_access(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships tm
    WHERE tm.tenant_id = check_tenant_id AND tm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'board_member')
  );
END;
$$;

-- RLS for board_agenda_items
CREATE POLICY "Board read agenda" ON public.board_agenda_items
FOR SELECT USING (has_board_access(tenant_id));

CREATE POLICY "Board admin insert agenda" ON public.board_agenda_items
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

CREATE POLICY "Board admin update agenda" ON public.board_agenda_items
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

CREATE POLICY "Board admin delete agenda" ON public.board_agenda_items
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

-- RLS for board_item_comments
CREATE POLICY "Board read comments" ON public.board_item_comments
FOR SELECT USING (has_board_access(tenant_id) AND (NOT is_private OR author_user_id = auth.uid()));

CREATE POLICY "Board insert own comments" ON public.board_item_comments
FOR INSERT WITH CHECK (has_board_access(tenant_id) AND author_user_id = auth.uid());

CREATE POLICY "Board update own comments" ON public.board_item_comments
FOR UPDATE USING (
  author_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

CREATE POLICY "Board delete own comments" ON public.board_item_comments
FOR DELETE USING (
  author_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

-- RLS for board_decisions
CREATE POLICY "Board read decisions" ON public.board_decisions
FOR SELECT USING (has_board_access(tenant_id));

CREATE POLICY "Board admin manage decisions" ON public.board_decisions
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

-- RLS for board_generated_outputs
CREATE POLICY "Board read outputs" ON public.board_generated_outputs
FOR SELECT USING (has_board_access(tenant_id));

CREATE POLICY "Board admin manage outputs" ON public.board_generated_outputs
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin'))
);

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_board_agenda_items_updated_at ON public.board_agenda_items;
CREATE TRIGGER update_board_agenda_items_updated_at
BEFORE UPDATE ON public.board_agenda_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_item_comments_updated_at ON public.board_item_comments;
CREATE TRIGGER update_board_item_comments_updated_at
BEFORE UPDATE ON public.board_item_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_decisions_updated_at ON public.board_decisions;
CREATE TRIGGER update_board_decisions_updated_at
BEFORE UPDATE ON public.board_decisions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();