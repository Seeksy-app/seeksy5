-- =============================================
-- COMPREHENSIVE SCHEMA: All Missing Tables
-- =============================================

-- 1. GBP Admin Settings
CREATE TABLE IF NOT EXISTS public.gbp_admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  write_mode_enabled BOOLEAN DEFAULT false,
  default_response_tone TEXT DEFAULT 'friendly',
  auto_respond_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gbp_admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GBP settings" ON public.gbp_admin_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view GBP settings" ON public.gbp_admin_settings
  FOR SELECT USING (true);

-- 2. GBP Locations
CREATE TABLE IF NOT EXISTS public.gbp_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_location_id TEXT,
  title TEXT NOT NULL,
  address_json JSONB DEFAULT '{}',
  phone_number TEXT,
  website_url TEXT,
  primary_category TEXT,
  additional_categories TEXT[] DEFAULT '{}',
  business_hours JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  verification_status TEXT DEFAULT 'unverified',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gbp_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GBP locations" ON public.gbp_locations
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view GBP locations" ON public.gbp_locations
  FOR SELECT USING (true);

CREATE INDEX idx_gbp_locations_google_id ON public.gbp_locations(google_location_id);

-- 3. SEO Pages
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  meta_description TEXT,
  h1_tag TEXT,
  content TEXT,
  target_keywords TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all SEO pages" ON public.seo_pages
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own SEO pages" ON public.seo_pages
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_seo_pages_user_id ON public.seo_pages(user_id);
CREATE INDEX idx_seo_pages_slug ON public.seo_pages(slug);

-- 4. GBP SEO Links
CREATE TABLE IF NOT EXISTS public.gbp_seo_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gbp_location_id UUID REFERENCES public.gbp_locations(id) ON DELETE CASCADE,
  seo_page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  sync_status TEXT DEFAULT 'linked',
  last_checked_at TIMESTAMP WITH TIME ZONE,
  drift_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gbp_location_id, seo_page_id)
);

ALTER TABLE public.gbp_seo_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GBP SEO links" ON public.gbp_seo_links
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view GBP SEO links" ON public.gbp_seo_links
  FOR SELECT USING (true);

CREATE INDEX idx_gbp_seo_links_location ON public.gbp_seo_links(gbp_location_id);
CREATE INDEX idx_gbp_seo_links_seo_page ON public.gbp_seo_links(seo_page_id);

-- 5. GBP Audit Log
CREATE TABLE IF NOT EXISTS public.gbp_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID,
  action_type TEXT NOT NULL,
  actor_user_id UUID,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gbp_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GBP audit log" ON public.gbp_audit_log
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own audit entries" ON public.gbp_audit_log
  FOR SELECT USING (auth.uid() = actor_user_id);

CREATE INDEX idx_gbp_audit_log_actor ON public.gbp_audit_log(actor_user_id);
CREATE INDEX idx_gbp_audit_log_action ON public.gbp_audit_log(action_type);

-- 6. SEO AI Suggestions
CREATE TABLE IF NOT EXISTS public.seo_ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  gbp_location_id UUID REFERENCES public.gbp_locations(id),
  status TEXT DEFAULT 'pending',
  model TEXT,
  tone TEXT DEFAULT 'professional',
  include_reviews BOOLEAN DEFAULT false,
  include_photos BOOLEAN DEFAULT false,
  include_services BOOLEAN DEFAULT false,
  suggestions JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.seo_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all AI suggestions" ON public.seo_ai_suggestions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own AI suggestions" ON public.seo_ai_suggestions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_seo_ai_suggestions_user ON public.seo_ai_suggestions(user_id);
CREATE INDEX idx_seo_ai_suggestions_location ON public.seo_ai_suggestions(gbp_location_id);

-- 7. CMO Campaigns
CREATE TABLE IF NOT EXISTS public.cmo_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'marketing',
  status TEXT DEFAULT 'draft',
  budget NUMERIC DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience JSONB DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  goals JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cmo_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all CMO campaigns" ON public.cmo_campaigns
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own CMO campaigns" ON public.cmo_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_cmo_campaigns_user ON public.cmo_campaigns(user_id);
CREATE INDEX idx_cmo_campaigns_status ON public.cmo_campaigns(status);

-- 8. CRM Sales Leads
CREATE TABLE IF NOT EXISTS public.crm_sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  contact_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  value NUMERIC DEFAULT 0,
  notes TEXT,
  assigned_to UUID,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_sales_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sales leads" ON public.crm_sales_leads
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own sales leads" ON public.crm_sales_leads
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_crm_sales_leads_user ON public.crm_sales_leads(user_id);
CREATE INDEX idx_crm_sales_leads_status ON public.crm_sales_leads(status);

-- 9. CRM Contacts
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all contacts" ON public.crm_contacts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own contacts" ON public.crm_contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_crm_contacts_user ON public.crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);

-- 10. CRM Activity Timeline
CREATE TABLE IF NOT EXISTS public.crm_activity_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_sales_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_activity_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all activities" ON public.crm_activity_timeline
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own activities" ON public.crm_activity_timeline
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_crm_activity_user ON public.crm_activity_timeline(user_id);
CREATE INDEX idx_crm_activity_contact ON public.crm_activity_timeline(contact_id);
CREATE INDEX idx_crm_activity_lead ON public.crm_activity_timeline(lead_id);

-- 11. CRM Site Leads
CREATE TABLE IF NOT EXISTS public.crm_site_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'website',
  form_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new',
  converted_to_lead_id UUID REFERENCES public.crm_sales_leads(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.crm_site_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all site leads" ON public.crm_site_leads
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own site leads" ON public.crm_site_leads
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_crm_site_leads_user ON public.crm_site_leads(user_id);
CREATE INDEX idx_crm_site_leads_status ON public.crm_site_leads(status);

-- 12. CCO AI Sessions
CREATE TABLE IF NOT EXISTS public.cco_ai_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_type TEXT NOT NULL,
  title TEXT,
  messages JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cco_ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all AI sessions" ON public.cco_ai_sessions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own AI sessions" ON public.cco_ai_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_cco_ai_sessions_user ON public.cco_ai_sessions(user_id);

-- 13. Activity Logs (for activityLogger.ts)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  action_description TEXT,
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can manage own activity logs" ON public.activity_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action_type);

-- Insert default GBP admin settings
INSERT INTO public.gbp_admin_settings (write_mode_enabled, default_response_tone)
VALUES (false, 'friendly')
ON CONFLICT DO NOTHING;