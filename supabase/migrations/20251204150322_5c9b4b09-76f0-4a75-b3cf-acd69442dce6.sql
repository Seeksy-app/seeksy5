
-- =============================================
-- ADMIN CRM SUITE TABLES
-- =============================================

-- CRM Contacts (unified user/lead profile)
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  lead_stage TEXT DEFAULT 'new',
  lead_source TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  total_revenue NUMERIC(10,2) DEFAULT 0,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  health_score INTEGER DEFAULT 50,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRM Activity Timeline
CREATE TABLE IF NOT EXISTS public.crm_activity_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  actor_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Manager - Sales Leads
CREATE TABLE IF NOT EXISTS public.crm_sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id),
  title TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  stage TEXT DEFAULT 'new_inquiry',
  deal_value NUMERIC(10,2),
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  assigned_to UUID,
  source TEXT,
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead Manager - Site Leads
CREATE TABLE IF NOT EXISTS public.crm_site_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  lead_type TEXT NOT NULL,
  source_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  ai_classification TEXT,
  ai_suggested_response TEXT,
  status TEXT DEFAULT 'new',
  converted_to_contact_id UUID REFERENCES public.crm_contacts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Support Ticket Conversations
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_id UUID,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Support Quick Actions/Macros
CREATE TABLE IF NOT EXISTS public.support_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  keyboard_shortcut TEXT,
  usage_count INTEGER DEFAULT 0,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Internal Escalations
CREATE TABLE IF NOT EXISTS public.support_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  escalated_from UUID,
  escalated_to UUID,
  escalation_reason TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- =============================================
-- CMO GTM ENGINE TABLES
-- =============================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.cmo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  goal TEXT,
  target_audience JSONB DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  budget NUMERIC(10,2) DEFAULT 0,
  spent NUMERIC(10,2) DEFAULT 0,
  expected_roi NUMERIC(5,2),
  actual_roi NUMERIC(5,2),
  start_date DATE,
  end_date DATE,
  kpis JSONB DEFAULT '{}',
  creative_assets JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Channel Strategy
CREATE TABLE IF NOT EXISTS public.cmo_channel_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  strategy TEXT,
  primary_kpis TEXT[] DEFAULT '{}',
  budget_allocation NUMERIC(5,2) DEFAULT 0,
  target_cac NUMERIC(10,2),
  actual_cac NUMERIC(10,2),
  target_conversions INTEGER,
  actual_conversions INTEGER DEFAULT 0,
  timeline TEXT,
  owner_id UUID,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Metrics Snapshots
CREATE TABLE IF NOT EXISTS public.cmo_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cac_overall NUMERIC(10,2),
  ltv_overall NUMERIC(10,2),
  cac_ltv_ratio NUMERIC(5,2),
  monthly_burn NUMERIC(10,2),
  active_creators INTEGER,
  churn_rate NUMERIC(5,2),
  mrr NUMERIC(10,2),
  arr NUMERIC(12,2),
  pipeline_value NUMERIC(12,2),
  conversion_rate NUMERIC(5,2),
  traffic_total INTEGER,
  signups INTEGER,
  activations INTEGER,
  channel_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CEO Briefs
CREATE TABLE IF NOT EXISTS public.cmo_ceo_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  top_risks JSONB DEFAULT '[]',
  top_wins JSONB DEFAULT '[]',
  pipeline_forecast JSONB DEFAULT '{}',
  required_decisions JSONB DEFAULT '[]',
  budget_recommendations JSONB DEFAULT '[]',
  sprint_summary TEXT,
  executive_message TEXT,
  ai_generated BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft',
  sent_to TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Market Intelligence Feed
CREATE TABLE IF NOT EXISTS public.cmo_market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  source_url TEXT,
  source_name TEXT,
  urgency TEXT DEFAULT 'medium',
  relevance_score INTEGER DEFAULT 50,
  action_required BOOLEAN DEFAULT false,
  ai_analysis TEXT,
  tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CCO COMMAND CENTER TABLES
-- =============================================

-- Messaging Architecture
CREATE TABLE IF NOT EXISTS public.cco_messaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL,
  audience TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  usage_guidelines TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brand Voice Guardrails
CREATE TABLE IF NOT EXISTS public.cco_brand_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  examples TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Press Room
CREATE TABLE IF NOT EXISTS public.cco_press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  headline TEXT,
  subheadline TEXT,
  body TEXT,
  boilerplate TEXT,
  media_contact TEXT,
  embargo_date TIMESTAMPTZ,
  publish_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  ai_generated BOOLEAN DEFAULT false,
  template_used TEXT,
  distribution_channels TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crisis Communications
CREATE TABLE IF NOT EXISTS public.cco_crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  crisis_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  description TEXT,
  affected_users INTEGER DEFAULT 0,
  affected_systems TEXT[] DEFAULT '{}',
  detection_method TEXT,
  internal_response TEXT,
  public_statement TEXT,
  assigned_roles JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '[]',
  resolution_notes TEXT,
  post_mortem_url TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice of Seeksy AI Sessions
CREATE TABLE IF NOT EXISTS public.cco_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_type TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT,
  tone_requested TEXT,
  context TEXT,
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Communication Templates
CREATE TABLE IF NOT EXISTS public.cco_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_stage ON public.crm_contacts(lead_stage);
CREATE INDEX IF NOT EXISTS idx_crm_activity_contact_id ON public.crm_activity_timeline(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_sales_leads_stage ON public.crm_sales_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_site_leads_status ON public.crm_site_leads(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cmo_campaigns_status ON public.cmo_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_cmo_metrics_date ON public.cmo_metrics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_cco_messaging_type ON public.cco_messaging(message_type);
CREATE INDEX IF NOT EXISTS idx_cco_crisis_status ON public.cco_crisis_events(status);

-- =============================================
-- RLS POLICIES (using admin role)
-- =============================================

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_site_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_channel_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_ceo_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmo_market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_messaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_brand_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cco_templates ENABLE ROW LEVEL SECURITY;

-- Admin access policies for all tables
CREATE POLICY "Admins can manage CRM contacts" ON public.crm_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage activity timeline" ON public.crm_activity_timeline FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage sales leads" ON public.crm_sales_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage site leads" ON public.crm_site_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage ticket messages" ON public.support_ticket_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage macros" ON public.support_macros FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage escalations" ON public.support_escalations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage campaigns" ON public.cmo_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage channel strategy" ON public.cmo_channel_strategy FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can view metrics" ON public.cmo_metrics_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage briefs" ON public.cmo_ceo_briefs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can view intelligence" ON public.cmo_market_intelligence FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage messaging" ON public.cco_messaging FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage brand voice" ON public.cco_brand_voice FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage press releases" ON public.cco_press_releases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage crisis events" ON public.cco_crisis_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can use AI sessions" ON public.cco_ai_sessions FOR ALL USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage templates" ON public.cco_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
