-- Intent-to-File Lead Capture System Tables

-- Drop existing if migration was partial
DROP TABLE IF EXISTS public.rep_assignments CASCADE;
DROP TABLE IF EXISTS public.claim_documents CASCADE;
DROP TABLE IF EXISTS public.claim_intents CASCADE;
DROP TABLE IF EXISTS public.veteran_leads CASCADE;

-- Veteran Leads - Primary lead capture table
CREATE TABLE public.veteran_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Veteran Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  state TEXT,
  ssn_last_four TEXT,
  
  -- Service Info
  branch TEXT,
  service_start_date DATE,
  service_end_date DATE,
  discharge_type TEXT,
  
  -- Lead Status
  intent_type TEXT NOT NULL CHECK (intent_type IN ('new_claim', 'increase', 'secondary', 'appeal')),
  status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN ('draft', 'prepared', 'assigned', 'submitted', 'follow_up', 'completed')),
  is_first_time_filer BOOLEAN DEFAULT true,
  
  -- Submission Tracking
  submitted_to_va BOOLEAN DEFAULT false,
  submission_confirmed_at TIMESTAMPTZ,
  confirmation_number TEXT,
  
  -- Lead Source
  source TEXT DEFAULT 'your_benefits',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claim Intents
CREATE TABLE public.claim_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veteran_lead_id UUID NOT NULL REFERENCES public.veteran_leads(id) ON DELETE CASCADE,
  claim_category TEXT NOT NULL,
  conditions TEXT[] NOT NULL DEFAULT '{}',
  body_systems TEXT[],
  is_secondary BOOLEAN DEFAULT false,
  primary_condition_id UUID,
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claim Documents
CREATE TABLE public.claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veteran_lead_id UUID NOT NULL REFERENCES public.veteran_leads(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  form_type TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  is_generated BOOLEAN DEFAULT false,
  is_uploaded BOOLEAN DEFAULT false,
  is_submitted BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rep Assignments
CREATE TABLE public.rep_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veteran_lead_id UUID NOT NULL REFERENCES public.veteran_leads(id) ON DELETE CASCADE,
  rep_id UUID,
  rep_type TEXT NOT NULL CHECK (rep_type IN ('vso', 'attorney', 'claims_agent', 'partner', 'pending')),
  rep_name TEXT,
  rep_organization TEXT,
  rep_email TEXT,
  rep_phone TEXT,
  assignment_method TEXT DEFAULT 'geo_recommended',
  assignment_reason TEXT,
  is_monetized BOOLEAN DEFAULT false,
  lead_value_cents INTEGER,
  intro_email_sent_at TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_veteran_leads_user ON veteran_leads(user_id);
CREATE INDEX idx_veteran_leads_status ON veteran_leads(status);
CREATE INDEX idx_veteran_leads_email ON veteran_leads(email);
CREATE INDEX idx_claim_intents_lead ON claim_intents(veteran_lead_id);
CREATE INDEX idx_claim_documents_lead ON claim_documents(veteran_lead_id);
CREATE INDEX idx_rep_assignments_lead ON rep_assignments(veteran_lead_id);

-- Enable RLS
ALTER TABLE public.veteran_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rep_assignments ENABLE ROW LEVEL SECURITY;

-- veteran_leads policies
CREATE POLICY "vl_select_own" ON public.veteran_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vl_insert" ON public.veteran_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "vl_update_own" ON public.veteran_leads FOR UPDATE USING (auth.uid() = user_id);

-- claim_intents policies
CREATE POLICY "ci_select" ON public.claim_intents FOR SELECT 
  USING (veteran_lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));
CREATE POLICY "ci_insert" ON public.claim_intents FOR INSERT WITH CHECK (true);

-- claim_documents policies  
CREATE POLICY "cd_select" ON public.claim_documents FOR SELECT
  USING (veteran_lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));
CREATE POLICY "cd_insert" ON public.claim_documents FOR INSERT WITH CHECK (true);

-- rep_assignments policies
CREATE POLICY "ra_select" ON public.rep_assignments FOR SELECT
  USING (veteran_lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));
CREATE POLICY "ra_insert" ON public.rep_assignments FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_veteran_leads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER veteran_leads_updated_at
  BEFORE UPDATE ON veteran_leads
  FOR EACH ROW EXECUTE FUNCTION update_veteran_leads_timestamp();