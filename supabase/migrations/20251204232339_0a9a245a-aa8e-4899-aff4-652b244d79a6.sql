-- Add new permissions for financials and marketing
INSERT INTO public.role_permissions (role, permission) VALUES
  -- financials.view and financials.manage for admin roles
  ('super_admin', 'financials.view'),
  ('super_admin', 'financials.manage'),
  ('admin', 'financials.view'),
  ('admin', 'financials.manage'),
  ('cfo', 'financials.view'),
  ('cfo', 'financials.manage'),
  ('board_member', 'financials.view'),
  
  -- CFO additional permissions
  ('cfo', 'billing.view'),
  ('cfo', 'ads.analytics'),
  ('cfo', 'board.analytics'),
  ('cfo', 'rnd.read'),
  
  -- CMO permissions
  ('cmo', 'marketing.view'),
  ('cmo', 'marketing.manage'),
  ('cmo', 'ads.view'),
  ('cmo', 'ads.analytics'),
  ('cmo', 'crm.view'),
  ('cmo', 'events.view'),
  ('cmo', 'events.manage'),
  ('cmo', 'rnd.read'),
  
  -- CCO permissions
  ('cco', 'media.view'),
  ('cco', 'media.upload'),
  ('cco', 'media.delete'),
  ('cco', 'clips.view'),
  ('cco', 'clips.edit'),
  ('cco', 'clips.delete'),
  ('cco', 'podcasts.view'),
  ('cco', 'podcasts.manage'),
  ('cco', 'creatorhub.view'),
  ('cco', 'creatorhub.manage'),
  ('cco', 'events.view'),
  ('cco', 'events.manage'),
  ('cco', 'crm.view'),
  
  -- Manager permissions
  ('manager', 'core.read'),
  ('manager', 'core.write'),
  ('manager', 'supportdesk.view'),
  ('manager', 'supportdesk.reply'),
  ('manager', 'crm.view'),
  ('manager', 'crm.manage'),
  ('manager', 'meetings.view'),
  ('manager', 'meetings.manage'),
  ('manager', 'billing.view')
ON CONFLICT (role, permission) DO NOTHING;

-- Drop and recreate cfo_swot with correct schema
DROP TABLE IF EXISTS public.cfo_swot;

CREATE TABLE public.cfo_swot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  strengths TEXT DEFAULT '',
  weaknesses TEXT DEFAULT '',
  opportunities TEXT DEFAULT '',
  threats TEXT DEFAULT '',
  ai_last_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cfo_swot ENABLE ROW LEVEL SECURITY;

-- RLS Policies using role checks
CREATE POLICY "cfo_swot_select" ON public.cfo_swot
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'cfo', 'board_member')
    )
  );

CREATE POLICY "cfo_swot_insert" ON public.cfo_swot
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'cfo')
    )
  );

CREATE POLICY "cfo_swot_update" ON public.cfo_swot
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'cfo')
    )
  );

-- Create swot_change_history table for audit
CREATE TABLE public.swot_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swot_id UUID REFERENCES public.cfo_swot(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changed_field TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.swot_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swot_history_select" ON public.swot_change_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'cfo', 'board_member')
    )
  );

CREATE POLICY "swot_history_insert" ON public.swot_change_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger to track updates
CREATE OR REPLACE FUNCTION log_swot_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.strengths IS DISTINCT FROM NEW.strengths THEN
    INSERT INTO public.swot_change_history (swot_id, changed_by, changed_field)
    VALUES (NEW.id, auth.uid(), 'Strengths');
  END IF;
  IF OLD.weaknesses IS DISTINCT FROM NEW.weaknesses THEN
    INSERT INTO public.swot_change_history (swot_id, changed_by, changed_field)
    VALUES (NEW.id, auth.uid(), 'Weaknesses');
  END IF;
  IF OLD.opportunities IS DISTINCT FROM NEW.opportunities THEN
    INSERT INTO public.swot_change_history (swot_id, changed_by, changed_field)
    VALUES (NEW.id, auth.uid(), 'Opportunities');
  END IF;
  IF OLD.threats IS DISTINCT FROM NEW.threats THEN
    INSERT INTO public.swot_change_history (swot_id, changed_by, changed_field)
    VALUES (NEW.id, auth.uid(), 'Threats');
  END IF;
  IF OLD.ai_last_summary IS DISTINCT FROM NEW.ai_last_summary THEN
    INSERT INTO public.swot_change_history (swot_id, changed_by, changed_field)
    VALUES (NEW.id, auth.uid(), 'AI Summary');
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER swot_change_trigger
  BEFORE UPDATE ON public.cfo_swot
  FOR EACH ROW
  EXECUTE FUNCTION log_swot_change();