-- ============================================
-- SUPPORT DESK CRM TABLES
-- ============================================

-- Support ticket categories
CREATE TABLE IF NOT EXISTS public.support_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Support tickets (main table)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.support_ticket_categories(id) ON DELETE SET NULL,
  issue_type TEXT, -- bug, feature_request, billing, account, technical, etc.
  status TEXT NOT NULL DEFAULT 'open', -- open, pending, waiting_on_customer, escalated, closed
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  severity_score INTEGER DEFAULT 50, -- AI-generated 0-100
  sentiment_score INTEGER DEFAULT 50, -- AI-generated 0-100
  churn_risk_score INTEGER DEFAULT 0, -- AI-generated 0-100
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_team TEXT, -- support, engineering, finance, marketing, cco
  escalated_to TEXT, -- team escalated to
  escalation_reason TEXT,
  tags TEXT[],
  sla_due_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'portal', -- portal, email, system, chat
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  ticket_num TEXT;
BEGIN
  year_part := to_char(now(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM support_tickets
  WHERE ticket_number LIKE 'TK' || year_part || '%';
  ticket_num := 'TK' || year_part || LPAD(seq_num::TEXT, 6, '0');
  RETURN ticket_num;
END;
$$;

-- Set ticket number trigger
CREATE OR REPLACE FUNCTION set_support_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_support_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_support_ticket_number_trigger ON support_tickets;
CREATE TRIGGER set_support_ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_support_ticket_number();

-- Ticket messages (threaded conversation)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'user', -- user, agent, system
  sender_name TEXT,
  sender_email TEXT,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  ai_suggested_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ticket attachments
CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.support_ticket_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Knowledge base articles
CREATE TABLE IF NOT EXISTS public.support_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_internal BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Saved replies (macros)
CREATE TABLE IF NOT EXISTS public.support_saved_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  category TEXT,
  is_shared BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User support profiles (extended CRM data)
CREATE TABLE IF NOT EXISTS public.user_support_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engagement_score INTEGER DEFAULT 50,
  churn_risk_score INTEGER DEFAULT 0,
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  average_sentiment INTEGER DEFAULT 50,
  last_ticket_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_uploads_count INTEGER DEFAULT 0,
  billing_issues_count INTEGER DEFAULT 0,
  internal_notes TEXT,
  internal_tags TEXT[],
  vip_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Support automation rules
CREATE TABLE IF NOT EXISTS public.support_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- on_create, on_update, on_status_change, scheduled
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]', -- array of actions to perform
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- CMO GTM OPERATING SYSTEM TABLES
-- ============================================

-- CEO Intent (Commander's Intent Engine)
CREATE TABLE IF NOT EXISTS public.ceo_strategic_intent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER DEFAULT 1,
  mission TEXT NOT NULL,
  vision TEXT,
  objectives JSONB DEFAULT '[]', -- array of objectives with priorities
  priorities JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '[]',
  redlines JSONB DEFAULT '[]', -- things that must NOT happen
  target_markets JSONB DEFAULT '[]',
  key_metrics JSONB DEFAULT '[]',
  quarterly_goals JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CMO Metrics snapshots
CREATE TABLE IF NOT EXISTS public.cmo_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  cac_overall DECIMAL(12,2),
  cac_by_channel JSONB DEFAULT '{}',
  ltv_overall DECIMAL(12,2),
  ltv_by_segment JSONB DEFAULT '{}',
  cac_ltv_ratio DECIMAL(8,4),
  monthly_burn DECIMAL(12,2),
  runway_months INTEGER,
  mrr DECIMAL(12,2),
  arr DECIMAL(12,2),
  creator_count INTEGER,
  active_creator_count INTEGER,
  churn_rate DECIMAL(8,4),
  retention_rate DECIMAL(8,4),
  conversion_rate DECIMAL(8,4),
  ad_revenue DECIMAL(12,2),
  subscription_revenue DECIMAL(12,2),
  other_revenue DECIMAL(12,2),
  cohort_data JSONB DEFAULT '{}',
  funnel_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketing campaigns (CMO tracking)
CREATE TABLE IF NOT EXISTS public.cmo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT, -- acquisition, retention, brand, product_launch
  channels TEXT[],
  budget DECIMAL(12,2) DEFAULT 0,
  spent DECIMAL(12,2) DEFAULT 0,
  target_cac DECIMAL(12,2),
  actual_cac DECIMAL(12,2),
  target_conversions INTEGER,
  actual_conversions INTEGER,
  roi DECIMAL(8,4),
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  start_date DATE,
  end_date DATE,
  ceo_intent_alignment_score INTEGER, -- 0-100
  alignment_explanation TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market signals (radar)
CREATE TABLE IF NOT EXISTS public.market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL, -- competitor, news, social, policy, cost, trend
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  source_url TEXT,
  relevance_score INTEGER DEFAULT 50, -- 0-100
  impact_score INTEGER DEFAULT 50, -- 0-100
  urgency TEXT DEFAULT 'low', -- low, medium, high, critical
  category TEXT,
  tags TEXT[],
  ai_analysis TEXT,
  is_read BOOLEAN DEFAULT false,
  is_actionable BOOLEAN DEFAULT false,
  action_taken TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Decision simulations (What-If Engine)
CREATE TABLE IF NOT EXISTS public.decision_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scenario_description TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- input variables
  baseline_metrics JSONB DEFAULT '{}',
  simulated_metrics JSONB DEFAULT '{}',
  revenue_impact DECIMAL(12,2),
  cac_impact DECIMAL(12,2),
  ltv_impact DECIMAL(12,2),
  risk_score INTEGER DEFAULT 50,
  confidence_score INTEGER DEFAULT 50,
  ai_recommendation TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CMO Action items
CREATE TABLE IF NOT EXISTS public.cmo_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  category TEXT, -- growth, retention, brand, revenue, risk
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, deferred
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  impact_estimate TEXT,
  source TEXT, -- ai_generated, manual, market_signal, ceo_directive
  related_campaign_id UUID REFERENCES public.cmo_campaigns(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- CCO COMMUNICATIONS SYSTEM TABLES
-- ============================================

-- Message templates
CREATE TABLE IF NOT EXISTS public.cco_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- product_announcement, crisis, creator, investor, internal, partner
  subject TEXT,
  content TEXT NOT NULL,
  tone TEXT, -- formal, friendly, urgent, empathetic
  variables JSONB DEFAULT '[]', -- placeholders
  channels TEXT[], -- email, sms, in_app, social
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community sentiment aggregates
CREATE TABLE IF NOT EXISTS public.community_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  source TEXT NOT NULL, -- support_desk, platform_feedback, advertiser_feedback, social
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 50, -- 0-100
  trending_topics JSONB DEFAULT '[]',
  top_issues JSONB DEFAULT '[]',
  churn_correlation DECIMAL(8,4),
  notable_quotes JSONB DEFAULT '[]',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crisis events
CREATE TABLE IF NOT EXISTS public.cco_crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  crisis_type TEXT NOT NULL, -- outage, billing, security, pr, legal, ai_failure
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'active', -- active, monitoring, resolved
  description TEXT,
  affected_users_count INTEGER DEFAULT 0,
  affected_segments TEXT[],
  impact_assessment TEXT,
  risk_score INTEGER DEFAULT 50,
  talking_points JSONB DEFAULT '[]',
  ai_generated_response TEXT,
  official_response TEXT,
  channels_notified TEXT[],
  timeline JSONB DEFAULT '[]', -- event timeline
  resolved_at TIMESTAMP WITH TIME ZONE,
  post_mortem TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brand narratives / storytelling
CREATE TABLE IF NOT EXISTS public.cco_brand_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_type TEXT NOT NULL, -- press_release, social_script, brand_position, exec_message, video_script
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT,
  key_messages JSONB DEFAULT '[]',
  tone TEXT,
  status TEXT DEFAULT 'draft', -- draft, review, approved, published
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CEO Briefs from CCO
CREATE TABLE IF NOT EXISTS public.cco_ceo_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL,
  summary TEXT NOT NULL,
  key_risks JSONB DEFAULT '[]',
  sentiment_summary JSONB DEFAULT '{}',
  tone_guidance TEXT,
  stakeholder_impact JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  is_urgent BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- ENABLE RLS ON ALL NEW TABLES
-- ============================================

ALTER TABLE public.support_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_saved_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_support_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_strategic_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_brand_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_ceo_briefs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Admin/Staff only for most)
-- ============================================

-- Support tickets - users can see their own, admins see all
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (user_id = auth.uid() OR public.is_adm());

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE USING (public.is_adm());

CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE USING (public.is_adm());

-- Ticket messages - users can see on their tickets, admins see all
CREATE POLICY "Users can view messages on own tickets" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR public.is_adm()))
    AND (NOT is_internal_note OR public.is_adm())
  );

CREATE POLICY "Users can create messages on own tickets" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR public.is_adm()))
  );

-- Admin-only tables
CREATE POLICY "Admins only - categories" ON public.support_ticket_categories
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - attachments" ON public.support_ticket_attachments
  FOR ALL USING (public.is_adm() OR EXISTS (
    SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins only - kb" ON public.support_knowledge_base
  FOR SELECT USING (is_published = true OR public.is_adm());

CREATE POLICY "Admins manage kb" ON public.support_knowledge_base
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - saved_replies" ON public.support_saved_replies
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - user_support_profiles" ON public.user_support_profiles
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - automation_rules" ON public.support_automation_rules
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - ceo_intent" ON public.ceo_strategic_intent
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - cmo_metrics" ON public.cmo_metrics_snapshots
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - cmo_campaigns" ON public.cmo_campaigns
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - market_signals" ON public.market_signals
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - simulations" ON public.decision_simulations
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - cmo_actions" ON public.cmo_action_items
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - cco_templates" ON public.cco_message_templates
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - community_sentiment" ON public.community_sentiment
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - crisis_events" ON public.cco_crisis_events
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - brand_narratives" ON public.cco_brand_narratives
  FOR ALL USING (public.is_adm());

CREATE POLICY "Admins only - ceo_briefs" ON public.cco_ceo_briefs
  FOR ALL USING (public.is_adm());

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cmo_metrics_date ON public.cmo_metrics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_signals_type ON public.market_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_community_sentiment_date ON public.community_sentiment(snapshot_date DESC);

-- ============================================
-- SEED DEFAULT TICKET CATEGORIES
-- ============================================

INSERT INTO public.support_ticket_categories (name, description, icon, color, display_order) VALUES
  ('Billing', 'Payment, subscription, and invoice issues', 'CreditCard', 'blue', 1),
  ('Technical', 'Bugs, errors, and technical problems', 'Bug', 'red', 2),
  ('Account', 'Account access, settings, and profile', 'User', 'purple', 3),
  ('Studio', 'Recording, streaming, and studio features', 'Video', 'green', 4),
  ('AI Features', 'AI clips, transcription, and automation', 'Sparkles', 'amber', 5),
  ('Feature Request', 'New feature suggestions', 'Lightbulb', 'yellow', 6),
  ('General', 'General inquiries and feedback', 'MessageCircle', 'gray', 7)
ON CONFLICT DO NOTHING;