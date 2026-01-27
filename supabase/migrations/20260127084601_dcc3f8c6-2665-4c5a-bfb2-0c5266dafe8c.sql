
-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  category text DEFAULT 'general',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL USING (is_admin(auth.uid()));

-- Create investor_shares table
CREATE TABLE IF NOT EXISTS public.investor_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  investor_email text NOT NULL,
  investor_name text NOT NULL,
  access_code text NOT NULL,
  status text DEFAULT 'pending',
  shares_percentage numeric DEFAULT 0,
  investment_amount numeric DEFAULT 0,
  notes text,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.investor_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own investor shares" ON public.investor_shares
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all investor shares" ON public.investor_shares
  FOR ALL USING (is_admin(auth.uid()));

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text DEFAULT 'medium',
  title text NOT NULL,
  description text,
  source text,
  source_ip text,
  endpoint text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
  FOR ALL USING (is_admin(auth.uid()));

-- Create blog_generation_schedules table
CREATE TABLE IF NOT EXISTS public.blog_generation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text DEFAULT 'Untitled Schedule',
  portal text NOT NULL,
  category text NOT NULL,
  article_count integer DEFAULT 1,
  schedule_time text DEFAULT '09:00',
  timezone text DEFAULT 'UTC',
  frequency_hours integer DEFAULT 24,
  keywords text[] DEFAULT '{}',
  tone text DEFAULT 'professional',
  next_run_at timestamptz,
  last_run_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_generation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedules" ON public.blog_generation_schedules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all schedules" ON public.blog_generation_schedules
  FOR ALL USING (is_admin(auth.uid()));

-- Create CCO Brand Voice table
CREATE TABLE IF NOT EXISTS public.cco_brand_voice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  examples text[] DEFAULT '{}',
  do_list text[] DEFAULT '{}',
  dont_list text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cco_brand_voice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own brand voice" ON public.cco_brand_voice
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all brand voice" ON public.cco_brand_voice
  FOR ALL USING (is_admin(auth.uid()));

-- Create CCO Crisis Events table
CREATE TABLE IF NOT EXISTS public.cco_crisis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  crisis_type text NOT NULL,
  severity text DEFAULT 'medium',
  status text DEFAULT 'monitoring',
  description text,
  impact_assessment text,
  response_plan text,
  stakeholders text[] DEFAULT '{}',
  timeline jsonb DEFAULT '[]'::jsonb,
  lessons_learned text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cco_crisis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crisis events" ON public.cco_crisis_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all crisis events" ON public.cco_crisis_events
  FOR ALL USING (is_admin(auth.uid()));

-- Create CCO Messaging table
CREATE TABLE IF NOT EXISTS public.cco_messaging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_type text NOT NULL,
  audience text NOT NULL,
  title text NOT NULL,
  content text,
  key_points text[] DEFAULT '{}',
  channels text[] DEFAULT '{}',
  is_approved boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cco_messaging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messaging" ON public.cco_messaging
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messaging" ON public.cco_messaging
  FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_investor_shares_user ON public.investor_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_blog_schedules_user ON public.blog_generation_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_cco_brand_voice_user ON public.cco_brand_voice(user_id);
CREATE INDEX IF NOT EXISTS idx_cco_crisis_events_user ON public.cco_crisis_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cco_messaging_user ON public.cco_messaging(user_id);
