-- Lead Intelligence Database Schema

-- Lead Workspaces (multi-tenant container)
CREATE TABLE public.lead_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'owner' CHECK (mode IN ('owner', 'agency')),
  allow_pii_export BOOLEAN NOT NULL DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Workspace Memberships (for agency mode)
CREATE TABLE public.lead_workspace_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Lead Domains (verified domains for pixel tracking)
CREATE TABLE public.lead_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'disabled')),
  verification_method TEXT CHECK (verification_method IN ('dns_txt', 'meta_tag', 'html_file')),
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, domain)
);

-- Lead Providers (connected enrichment services)
CREATE TABLE public.lead_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('warmly', 'opensend', 'other')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  external_account_id TEXT,
  scopes TEXT[],
  webhook_url TEXT,
  webhook_secret TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

-- Lead Provider Tokens (encrypted credentials - edge functions only)
CREATE TABLE public.lead_provider_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('warmly', 'opensend', 'other')),
  encrypted_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

-- Leads (main leads table)
CREATE TABLE public.lead_intel_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.lead_domains(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_type TEXT NOT NULL DEFAULT 'unknown' CHECK (lead_type IN ('b2b', 'b2c', 'unknown')),
  company_name TEXT,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  person_name TEXT,
  person_title TEXT,
  email TEXT,
  phone TEXT,
  geo JSONB DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'pixel' CHECK (source IN ('warmly', 'opensend', 'pixel', 'manual')),
  confidence INT DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  intent_score INT DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'contacted', 'meeting_set', 'closed', 'ignored')),
  assigned_to_user_id UUID,
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Events (pageviews, form submits, etc.)
CREATE TABLE public.lead_intel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.lead_intel_leads(id) ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL,
  url TEXT,
  referrer TEXT,
  utm JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Scoring Rules
CREATE TABLE public.lead_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  rules JSONB NOT NULL DEFAULT '[]',
  decay_half_life_days INT DEFAULT 14,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Actions (outbound touches, CRM pushes, etc.)
CREATE TABLE public.lead_intel_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.lead_intel_leads(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('email', 'sms', 'webhook', 'crm_push', 'note', 'assign', 'export')),
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'canceled')),
  error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Audit Log
CREATE TABLE public.lead_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  actor_user_id UUID,
  event TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Credits Ledger
CREATE TABLE public.lead_credits_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  units INT NOT NULL,
  balance_after INT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Workspace Credits (running balance)
CREATE TABLE public.lead_workspace_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.lead_workspaces(id) ON DELETE CASCADE UNIQUE,
  balance INT NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_lead_intel_leads_workspace ON public.lead_intel_leads(workspace_id);
CREATE INDEX idx_lead_intel_leads_status ON public.lead_intel_leads(status);
CREATE INDEX idx_lead_intel_leads_intent ON public.lead_intel_leads(intent_score DESC);
CREATE INDEX idx_lead_intel_leads_last_seen ON public.lead_intel_leads(last_seen_at DESC);
CREATE INDEX idx_lead_intel_events_workspace ON public.lead_intel_events(workspace_id);
CREATE INDEX idx_lead_intel_events_lead ON public.lead_intel_events(lead_id);
CREATE INDEX idx_lead_intel_events_occurred ON public.lead_intel_events(occurred_at DESC);
CREATE INDEX idx_lead_audit_log_workspace ON public.lead_audit_log(workspace_id);
CREATE INDEX idx_lead_domains_domain ON public.lead_domains(domain);

-- Enable RLS on all tables
ALTER TABLE public.lead_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_provider_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_intel_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_intel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_intel_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_workspace_credits ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has access to workspace
CREATE OR REPLACE FUNCTION public.has_lead_workspace_access(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lead_workspaces WHERE id = _workspace_id AND owner_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM lead_workspace_memberships WHERE workspace_id = _workspace_id AND user_id = _user_id
  )
$$;

-- Helper function: Get user's workspace IDs
CREATE OR REPLACE FUNCTION public.get_user_lead_workspace_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM lead_workspaces WHERE owner_user_id = _user_id
  UNION
  SELECT workspace_id FROM lead_workspace_memberships WHERE user_id = _user_id
$$;

-- RLS Policies for lead_workspaces
CREATE POLICY "Users can view their own workspaces"
  ON public.lead_workspaces FOR SELECT
  USING (owner_user_id = auth.uid() OR id IN (SELECT workspace_id FROM lead_workspace_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can create workspaces"
  ON public.lead_workspaces FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their workspaces"
  ON public.lead_workspaces FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON public.lead_workspaces FOR DELETE
  USING (owner_user_id = auth.uid());

-- RLS Policies for lead_workspace_memberships
CREATE POLICY "Members can view their memberships"
  ON public.lead_workspace_memberships FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (SELECT id FROM lead_workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "Workspace owners can manage memberships"
  ON public.lead_workspace_memberships FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM lead_workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "Workspace owners can update memberships"
  ON public.lead_workspace_memberships FOR UPDATE
  USING (workspace_id IN (SELECT id FROM lead_workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "Workspace owners can delete memberships"
  ON public.lead_workspace_memberships FOR DELETE
  USING (workspace_id IN (SELECT id FROM lead_workspaces WHERE owner_user_id = auth.uid()));

-- RLS Policies for lead_domains
CREATE POLICY "Users can view domains in their workspaces"
  ON public.lead_domains FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can create domains in their workspaces"
  ON public.lead_domains FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can update domains in their workspaces"
  ON public.lead_domains FOR UPDATE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can delete domains in their workspaces"
  ON public.lead_domains FOR DELETE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_providers
CREATE POLICY "Users can view providers in their workspaces"
  ON public.lead_providers FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can manage providers in their workspaces"
  ON public.lead_providers FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can update providers in their workspaces"
  ON public.lead_providers FOR UPDATE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can delete providers in their workspaces"
  ON public.lead_providers FOR DELETE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_provider_tokens (restricted - no client access)
CREATE POLICY "No direct client access to tokens"
  ON public.lead_provider_tokens FOR SELECT
  USING (false);

-- RLS Policies for lead_intel_leads
CREATE POLICY "Users can view leads in their workspaces"
  ON public.lead_intel_leads FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can create leads in their workspaces"
  ON public.lead_intel_leads FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can update leads in their workspaces"
  ON public.lead_intel_leads FOR UPDATE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can delete leads in their workspaces"
  ON public.lead_intel_leads FOR DELETE
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_intel_events
CREATE POLICY "Users can view events in their workspaces"
  ON public.lead_intel_events FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can create events in their workspaces"
  ON public.lead_intel_events FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_scoring_rules
CREATE POLICY "Users can view scoring rules in their workspaces"
  ON public.lead_scoring_rules FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can manage scoring rules in their workspaces"
  ON public.lead_scoring_rules FOR ALL
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_intel_actions
CREATE POLICY "Users can view actions in their workspaces"
  ON public.lead_intel_actions FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "Users can create actions in their workspaces"
  ON public.lead_intel_actions FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_audit_log
CREATE POLICY "Users can view audit logs in their workspaces"
  ON public.lead_audit_log FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

CREATE POLICY "System can insert audit logs"
  ON public.lead_audit_log FOR INSERT
  WITH CHECK (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_credits_ledger
CREATE POLICY "Users can view credits in their workspaces"
  ON public.lead_credits_ledger FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- RLS Policies for lead_workspace_credits
CREATE POLICY "Users can view workspace credits"
  ON public.lead_workspace_credits FOR SELECT
  USING (has_lead_workspace_access(auth.uid(), workspace_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_lead_intel_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lead_workspaces_updated_at
  BEFORE UPDATE ON public.lead_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_domains_updated_at
  BEFORE UPDATE ON public.lead_domains
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_providers_updated_at
  BEFORE UPDATE ON public.lead_providers
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_provider_tokens_updated_at
  BEFORE UPDATE ON public.lead_provider_tokens
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_intel_leads_updated_at
  BEFORE UPDATE ON public.lead_intel_leads
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_scoring_rules_updated_at
  BEFORE UPDATE ON public.lead_scoring_rules
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

CREATE TRIGGER update_lead_workspace_credits_updated_at
  BEFORE UPDATE ON public.lead_workspace_credits
  FOR EACH ROW EXECUTE FUNCTION update_lead_intel_updated_at();

-- Function to initialize workspace credits
CREATE OR REPLACE FUNCTION public.init_lead_workspace_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lead_workspace_credits (workspace_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (workspace_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER init_workspace_credits
  AFTER INSERT ON public.lead_workspaces
  FOR EACH ROW EXECUTE FUNCTION init_lead_workspace_credits();

-- Function to log credit usage and update balance
CREATE OR REPLACE FUNCTION public.use_lead_credits(_workspace_id UUID, _event TEXT, _units INT, _meta JSONB DEFAULT '{}')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INT;
  new_balance INT;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM lead_workspace_credits
  WHERE workspace_id = _workspace_id
  FOR UPDATE;
  
  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if enough credits
  IF current_balance < _units THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  new_balance := current_balance - _units;
  
  UPDATE lead_workspace_credits
  SET balance = new_balance, updated_at = now()
  WHERE workspace_id = _workspace_id;
  
  -- Log to ledger
  INSERT INTO lead_credits_ledger (workspace_id, event, units, balance_after, meta)
  VALUES (_workspace_id, _event, -_units, new_balance, _meta);
  
  RETURN TRUE;
END;
$$;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_lead_credits(_workspace_id UUID, _event TEXT, _units INT, _meta JSONB DEFAULT '{}')
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE lead_workspace_credits
  SET balance = balance + _units, updated_at = now()
  WHERE workspace_id = _workspace_id
  RETURNING balance INTO new_balance;
  
  -- Log to ledger
  INSERT INTO lead_credits_ledger (workspace_id, event, units, balance_after, meta)
  VALUES (_workspace_id, _event, _units, new_balance, _meta);
  
  RETURN new_balance;
END;
$$;