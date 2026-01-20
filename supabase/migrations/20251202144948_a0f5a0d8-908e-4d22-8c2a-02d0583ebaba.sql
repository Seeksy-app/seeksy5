-- GTM Engine - Complete Schema

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION public.user_is_gtm_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GTM Projects (main container)
CREATE TABLE public.gtm_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  mode TEXT NOT NULL DEFAULT 'business_tool' CHECK (mode IN ('admin_cfo', 'business_tool')),
  name TEXT NOT NULL,
  description TEXT,
  primary_goal TEXT,
  target_market JSONB,
  budget_range TEXT,
  timeframe TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  onboarding_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GTM Project Channels
CREATE TABLE public.gtm_project_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtm_project_id UUID NOT NULL REFERENCES public.gtm_projects(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GTM Actions
CREATE TABLE public.gtm_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtm_project_id UUID NOT NULL REFERENCES public.gtm_projects(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.gtm_project_channels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_role TEXT,
  due_date DATE,
  effort_estimate TEXT CHECK (effort_estimate IN ('low', 'medium', 'high')),
  impact_estimate TEXT CHECK (impact_estimate IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'planned', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GTM Assumptions
CREATE TABLE public.gtm_assumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtm_project_id UUID NOT NULL REFERENCES public.gtm_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  value_numeric NUMERIC,
  value_text TEXT,
  is_key_assumption BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GTM Metrics Snapshots
CREATE TABLE public.gtm_metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gtm_project_id UUID NOT NULL REFERENCES public.gtm_projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kpi_name TEXT NOT NULL,
  kpi_value_numeric NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gtm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_project_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- GTM Projects RLS
CREATE POLICY "gtm_projects_select" ON public.gtm_projects
  FOR SELECT USING (
    (owner_user_id = auth.uid() AND mode = 'business_tool')
    OR user_is_gtm_admin()
  );

CREATE POLICY "gtm_projects_insert" ON public.gtm_projects
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "gtm_projects_update" ON public.gtm_projects
  FOR UPDATE USING (
    (owner_user_id = auth.uid() AND mode = 'business_tool')
    OR user_is_gtm_admin()
  );

CREATE POLICY "gtm_projects_delete" ON public.gtm_projects
  FOR DELETE USING (
    (owner_user_id = auth.uid() AND mode = 'business_tool')
    OR user_is_gtm_admin()
  );

-- GTM Project Channels RLS
CREATE POLICY "gtm_project_channels_all" ON public.gtm_project_channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gtm_projects p
      WHERE p.id = gtm_project_id
      AND ((p.owner_user_id = auth.uid() AND p.mode = 'business_tool') OR user_is_gtm_admin())
    )
  );

-- GTM Actions RLS
CREATE POLICY "gtm_actions_all" ON public.gtm_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gtm_projects p
      WHERE p.id = gtm_project_id
      AND ((p.owner_user_id = auth.uid() AND p.mode = 'business_tool') OR user_is_gtm_admin())
    )
  );

-- GTM Assumptions RLS
CREATE POLICY "gtm_assumptions_all" ON public.gtm_assumptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gtm_projects p
      WHERE p.id = gtm_project_id
      AND ((p.owner_user_id = auth.uid() AND p.mode = 'business_tool') OR user_is_gtm_admin())
    )
  );

-- GTM Metrics RLS
CREATE POLICY "gtm_metrics_all" ON public.gtm_metrics_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.gtm_projects p
      WHERE p.id = gtm_project_id
      AND ((p.owner_user_id = auth.uid() AND p.mode = 'business_tool') OR user_is_gtm_admin())
    )
  );

-- Indexes
CREATE INDEX idx_gtm_projects_owner ON public.gtm_projects(owner_user_id);
CREATE INDEX idx_gtm_projects_mode ON public.gtm_projects(mode);
CREATE INDEX idx_gtm_project_channels_project ON public.gtm_project_channels(gtm_project_id);
CREATE INDEX idx_gtm_actions_project ON public.gtm_actions(gtm_project_id);
CREATE INDEX idx_gtm_assumptions_project ON public.gtm_assumptions(gtm_project_id);
CREATE INDEX idx_gtm_metrics_project ON public.gtm_metrics_snapshots(gtm_project_id);