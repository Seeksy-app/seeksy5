-- Create milestones table for Admin management and Board display
CREATE TABLE public.milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'product' CHECK (category IN ('product', 'engineering', 'growth', 'fundraising', 'ops')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'at_risk', 'blocked')),
  owner TEXT,
  due_date DATE,
  progress_type TEXT NOT NULL DEFAULT 'manual' CHECK (progress_type IN ('manual', 'subtask', 'metric')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  metric_key TEXT,
  metric_target NUMERIC,
  metric_current NUMERIC,
  dependencies UUID[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestone subtasks table for subtask-based progress
CREATE TABLE public.milestone_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for milestones (admin/board member access)
CREATE POLICY "Admins can manage milestones" ON public.milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'platform_owner', 'cfo', 'board_member')
    )
  );

CREATE POLICY "Admins can manage subtasks" ON public.milestone_subtasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'platform_owner', 'cfo', 'board_member')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed demo milestones
INSERT INTO public.milestones (title, description, category, status, owner, due_date, progress_type, progress_percent, metric_key, metric_target, metric_current, is_demo, display_order) VALUES
('Launch AI Agent Studio', 'Complete development and launch of AI Agent Studio for creators', 'product', 'in_progress', 'Product Team', '2025-01-15', 'manual', 65, NULL, NULL, NULL, true, 1),
('Advertising Marketplace v1', 'Build and deploy first version of advertising marketplace', 'product', 'in_progress', 'Engineering', '2025-02-01', 'manual', 40, NULL, NULL, NULL, true, 2),
('Reach 1,000 Verified Creators', 'Grow identity-verified creator base to 1,000', 'growth', 'in_progress', 'Growth Team', '2025-03-01', 'metric', NULL, 'identity_verified_users', 1000, 234, true, 3),
('$50K MRR Milestone', 'Achieve $50,000 monthly recurring revenue', 'fundraising', 'not_started', 'CEO', '2025-06-01', 'metric', NULL, 'mrr', 50000, 12500, true, 4),
('Enterprise Onboarding Flow', 'Complete enterprise self-serve onboarding', 'ops', 'at_risk', 'Ops Team', '2025-01-20', 'subtask', NULL, NULL, NULL, NULL, true, 5),
('Marketplace Payouts System', 'Implement creator payout infrastructure', 'engineering', 'blocked', 'Engineering', '2025-02-15', 'manual', 20, NULL, NULL, NULL, true, 6);

-- Add subtasks for the Enterprise Onboarding milestone
INSERT INTO public.milestone_subtasks (milestone_id, title, is_completed, display_order)
SELECT id, 'Design onboarding flow', true, 1 FROM public.milestones WHERE title = 'Enterprise Onboarding Flow' AND is_demo = true
UNION ALL
SELECT id, 'Build signup wizard', true, 2 FROM public.milestones WHERE title = 'Enterprise Onboarding Flow' AND is_demo = true
UNION ALL
SELECT id, 'Integrate payment processing', false, 3 FROM public.milestones WHERE title = 'Enterprise Onboarding Flow' AND is_demo = true
UNION ALL
SELECT id, 'Add team management', false, 4 FROM public.milestones WHERE title = 'Enterprise Onboarding Flow' AND is_demo = true
UNION ALL
SELECT id, 'QA and launch', false, 5 FROM public.milestones WHERE title = 'Enterprise Onboarding Flow' AND is_demo = true;

-- Create index for faster queries
CREATE INDEX idx_milestones_category ON public.milestones(category);
CREATE INDEX idx_milestones_status ON public.milestones(status);
CREATE INDEX idx_milestones_due_date ON public.milestones(due_date);
CREATE INDEX idx_milestone_subtasks_milestone_id ON public.milestone_subtasks(milestone_id);