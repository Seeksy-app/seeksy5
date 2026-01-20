-- Lead Intelligence Schema with OpenSend Provider Support

-- Lead Sources: Workspace-level provider configurations
CREATE TABLE public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  provider text NOT NULL CHECK (provider IN ('warmly', 'opensend')),
  name text NOT NULL,
  api_key_configured boolean NOT NULL DEFAULT false,
  provider_account_id text,
  is_active boolean NOT NULL DEFAULT false,
  contact_level_enabled boolean NOT NULL DEFAULT false,
  include_contact_in_ai boolean NOT NULL DEFAULT false,
  privacy_notice_acknowledged_at timestamptz,
  privacy_notice_acknowledged_by uuid REFERENCES auth.users(id),
  webhook_health jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_days integer NOT NULL DEFAULT 90,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

-- Lead Identities: Visitor/person identity records
CREATE TABLE public.lead_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  provider text NOT NULL DEFAULT 'warmly' CHECK (provider IN ('warmly', 'opensend')),
  identity_type text NOT NULL CHECK (identity_type IN ('company', 'person')),
  external_id text,
  email_hash text,
  company_name text,
  company_domain text,
  contact_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  enrichment_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_identities_workspace ON public.lead_identities(workspace_id);
CREATE INDEX idx_lead_identities_provider ON public.lead_identities(provider);
CREATE INDEX idx_lead_identities_external ON public.lead_identities(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_lead_identities_email_hash ON public.lead_identities(email_hash) WHERE email_hash IS NOT NULL;

-- Leads: Aggregated lead records
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  identity_id uuid REFERENCES public.lead_identities(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'warmly' CHECK (provider IN ('warmly', 'opensend')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'engaged', 'qualified', 'converted', 'lost', 'archived')),
  intent_score integer NOT NULL DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
  intent_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  page_views integer NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_provider ON public.leads(provider);
CREATE INDEX idx_leads_identity ON public.leads(identity_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_intent ON public.leads(intent_score DESC);
CREATE INDEX idx_leads_last_activity ON public.leads(last_activity_at DESC);

-- Lead Events: Individual activity events
CREATE TABLE public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  identity_id uuid REFERENCES public.lead_identities(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'warmly' CHECK (provider IN ('warmly', 'opensend')),
  event_type text NOT NULL,
  page_url text,
  page_title text,
  referrer text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  intent_weight integer NOT NULL DEFAULT 1,
  dedupe_key text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_events_workspace ON public.lead_events(workspace_id);
CREATE INDEX idx_lead_events_lead ON public.lead_events(lead_id);
CREATE INDEX idx_lead_events_provider ON public.lead_events(provider);
CREATE INDEX idx_lead_events_occurred ON public.lead_events(occurred_at DESC);
CREATE UNIQUE INDEX idx_lead_events_dedupe ON public.lead_events(dedupe_key) WHERE dedupe_key IS NOT NULL;

-- Lead Actions: Outreach and follow-up actions
CREATE TABLE public.lead_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('email_draft', 'dm_draft', 'call_script', 'note', 'status_change', 'assignment')),
  channel text CHECK (channel IN ('email', 'dm', 'call', 'other')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_model text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_actions_lead ON public.lead_actions(lead_id);
CREATE INDEX idx_lead_actions_type ON public.lead_actions(action_type);

-- Credits Ledger: Usage tracking for billing
CREATE TABLE public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  event_type text NOT NULL,
  provider text CHECK (provider IN ('warmly', 'opensend', 'ai')),
  units integer NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  identity_id uuid REFERENCES public.lead_identities(id) ON DELETE SET NULL,
  dedupe_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credits_ledger_workspace ON public.credits_ledger(workspace_id);
CREATE INDEX idx_credits_ledger_event ON public.credits_ledger(event_type);
CREATE INDEX idx_credits_ledger_occurred ON public.credits_ledger(occurred_at DESC);
CREATE UNIQUE INDEX idx_credits_ledger_dedupe ON public.credits_ledger(dedupe_key) WHERE dedupe_key IS NOT NULL;

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_lead_intel_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
$$;

-- RLS Policies for lead_sources (admin-only write, members read)
CREATE POLICY "Admins can manage lead sources"
ON public.lead_sources FOR ALL TO authenticated
USING (public.is_lead_intel_admin())
WITH CHECK (public.is_lead_intel_admin());

CREATE POLICY "Members can view lead sources"
ON public.lead_sources FOR SELECT TO authenticated
USING (true);

-- RLS Policies for lead_identities (admin-only for contact fields)
CREATE POLICY "Admins can manage identities"
ON public.lead_identities FOR ALL TO authenticated
USING (public.is_lead_intel_admin())
WITH CHECK (public.is_lead_intel_admin());

CREATE POLICY "Members can view non-contact identity data"
ON public.lead_identities FOR SELECT TO authenticated
USING (
  provider = 'warmly' 
  OR public.is_lead_intel_admin()
  OR contact_fields = '{}'::jsonb
);

-- RLS Policies for leads (all members read, admin write)
CREATE POLICY "Admins can manage leads"
ON public.leads FOR ALL TO authenticated
USING (public.is_lead_intel_admin())
WITH CHECK (public.is_lead_intel_admin());

CREATE POLICY "Members can view leads"
ON public.leads FOR SELECT TO authenticated
USING (true);

-- RLS Policies for lead_events (edge functions insert, members read)
CREATE POLICY "Service role can insert events"
ON public.lead_events FOR INSERT TO authenticated
WITH CHECK (public.is_lead_intel_admin());

CREATE POLICY "Members can view events"
ON public.lead_events FOR SELECT TO authenticated
USING (true);

-- RLS Policies for lead_actions
CREATE POLICY "Users can manage their own actions"
ON public.lead_actions FOR ALL TO authenticated
USING (performed_by = auth.uid() OR public.is_lead_intel_admin())
WITH CHECK (performed_by = auth.uid() OR public.is_lead_intel_admin());

CREATE POLICY "Members can view all actions"
ON public.lead_actions FOR SELECT TO authenticated
USING (true);

-- RLS Policies for credits_ledger (admin-only)
CREATE POLICY "Admins can manage credits ledger"
ON public.credits_ledger FOR ALL TO authenticated
USING (public.is_lead_intel_admin())
WITH CHECK (public.is_lead_intel_admin());

CREATE POLICY "Members can view credits"
ON public.credits_ledger FOR SELECT TO authenticated
USING (true);

-- Updated at triggers
CREATE TRIGGER update_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_identities_updated_at
  BEFORE UPDATE ON public.lead_identities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();