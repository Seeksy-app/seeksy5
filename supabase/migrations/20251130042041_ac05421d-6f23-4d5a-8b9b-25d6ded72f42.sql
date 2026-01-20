-- Create checklist templates table
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist steps table
CREATE TABLE IF NOT EXISTS public.checklist_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  expected_result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist instances table
CREATE TABLE IF NOT EXISTS public.checklist_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  assigned_to TEXT,
  started_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist step completions table
CREATE TABLE IF NOT EXISTS public.checklist_step_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.checklist_instances(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.checklist_steps(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  notes TEXT,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  pass_fail TEXT CHECK (pass_fail IN ('pass', 'fail', NULL)),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_step_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can manage checklist templates"
  ON public.checklist_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage checklist steps"
  ON public.checklist_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage checklist instances"
  ON public.checklist_instances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage step completions"
  ON public.checklist_step_completions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Create indexes
CREATE INDEX idx_checklist_steps_template ON public.checklist_steps(template_id);
CREATE INDEX idx_checklist_instances_template ON public.checklist_instances(template_id);
CREATE INDEX idx_step_completions_instance ON public.checklist_step_completions(instance_id);
CREATE INDEX idx_step_completions_step ON public.checklist_step_completions(step_id);