-- Email Platform Phase 2: Advanced Segments, Automations, Smart Send, and Enhanced Analytics

-- ============================================
-- 1. SEGMENTS (Dynamic Lists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_dynamic BOOLEAN DEFAULT true,
  filter_logic TEXT DEFAULT 'AND', -- 'AND' or 'OR'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.segment_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
  filter_type TEXT NOT NULL, -- 'tag', 'event_attended', 'meeting_booked', 'podcast_subscribed', 'identity_status', 'activity', 'custom_field'
  operator TEXT NOT NULL, -- 'equals', 'contains', 'greater_than', 'less_than', 'in_last_days', 'is_true', 'is_false'
  field_name TEXT,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 2. AUTOMATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL, -- 'new_subscriber', 'event_registration', 'meeting_booked', 'podcast_published', 'identity_verified'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'send_email', 'add_to_list', 'add_tag', 'notify_admin'
  action_config JSONB, -- email_template_id, list_id, tag_name, admin_email, etc.
  action_order INTEGER DEFAULT 0,
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  trigger_data JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 3. SMART SEND (Send Time Optimization)
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL UNIQUE,
  avg_open_hour INTEGER, -- 0-23
  timezone TEXT,
  best_day_of_week INTEGER, -- 0-6
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  last_open_at TIMESTAMP WITH TIME ZONE,
  last_click_at TIMESTAMP WITH TIME ZONE,
  engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 4. ENHANCED EMAIL EVENTS (for deeper analytics)
-- ============================================
ALTER TABLE public.email_events 
ADD COLUMN IF NOT EXISTS device_type TEXT, -- 'desktop', 'mobile', 'tablet'
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS clicked_url TEXT,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

-- ============================================
-- 5. EMAIL ACCOUNT HEALTH
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_account_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  spam_complaints INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  spam_rate DECIMAL(5,2) DEFAULT 0,
  reputation_score INTEGER DEFAULT 100, -- 0-100
  dkim_status BOOLEAN DEFAULT true,
  spf_status BOOLEAN DEFAULT true,
  dmarc_status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(account_id, date)
);

-- ============================================
-- 6. CAMPAIGN DRAFTS (for autosave)
-- ============================================
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS draft_data JSONB;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_segments_user_id ON public.segments(user_id);
CREATE INDEX IF NOT EXISTS idx_segment_filters_segment_id ON public.segment_filters(segment_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_is_active ON public.automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_contact_id ON public.automation_runs(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_contact_engagement_contact_id ON public.contact_engagement_metrics(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_account_health_account_id ON public.email_account_health(account_id);
CREATE INDEX IF NOT EXISTS idx_email_account_health_date ON public.email_account_health(date);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_account_health ENABLE ROW LEVEL SECURITY;

-- Segments policies
CREATE POLICY "Users can manage their own segments"
  ON public.segments FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their segment filters"
  ON public.segment_filters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.segments
      WHERE segments.id = segment_filters.segment_id
      AND segments.user_id = auth.uid()
    )
  );

-- Automations policies
CREATE POLICY "Users can manage their own automations"
  ON public.automations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their automation actions"
  ON public.automation_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.automations
      WHERE automations.id = automation_actions.automation_id
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their automation runs"
  ON public.automation_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.automations
      WHERE automations.id = automation_runs.automation_id
      AND automations.user_id = auth.uid()
    )
  );

-- Engagement metrics policies
CREATE POLICY "Users can view engagement metrics for their contacts"
  ON public.contact_engagement_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_engagement_metrics.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Account health policies
CREATE POLICY "Users can view their account health"
  ON public.email_account_health FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_accounts
      WHERE email_accounts.id = email_account_health.account_id
      AND email_accounts.user_id = auth.uid()
    )
  );

-- Admin policies for all tables
CREATE POLICY "Admins can view all segments"
  ON public.segments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view all automations"
  ON public.automations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view all engagement metrics"
  ON public.contact_engagement_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view all account health"
  ON public.email_account_health FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));