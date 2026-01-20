-- Update veteran_leads to match PM spec data contract
ALTER TABLE public.veteran_leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT,
ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'email' CHECK (preferred_contact IN ('phone', 'email', 'sms', 'none'));

-- Update claim_intents to match PM spec
ALTER TABLE public.claim_intents 
ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('start_intent_to_file', 'learn', 'connect_rep', 'upload_help')),
ADD COLUMN IF NOT EXISTS service_era TEXT CHECK (service_era IN ('post_911', 'gulf_war', 'vietnam', 'peacetime', 'unknown')),
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
ADD COLUMN IF NOT EXISTS needs_rep BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rep_preference TEXT CHECK (rep_preference IN ('vso', 'attorney', 'claims_agent', 'no_preference', 'unknown'));

-- Create claim_handoffs table for tracking AccessVA handoff events
CREATE TABLE IF NOT EXISTS public.claim_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.veteran_leads(id) ON DELETE CASCADE,
  handoff_type TEXT NOT NULL DEFAULT 'accessva_quicksubmit',
  target_url TEXT DEFAULT 'https://eauth.va.gov/accessva/?cspSelectFor=quicksubmit',
  
  -- Event tracking
  clicked_accessva BOOLEAN DEFAULT false,
  clicked_accessva_at TIMESTAMPTZ,
  downloaded_docs BOOLEAN DEFAULT false,
  downloaded_docs_at TIMESTAMPTZ,
  requested_rep BOOLEAN DEFAULT false,
  requested_rep_at TIMESTAMPTZ,
  user_reported_uploaded BOOLEAN DEFAULT false,
  user_reported_uploaded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create claim_events table for analytics
CREATE TABLE IF NOT EXISTS public.claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.veteran_leads(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claim_handoffs_lead ON claim_handoffs(lead_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_lead ON claim_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_claim_events_name ON claim_events(event_name);
CREATE INDEX IF NOT EXISTS idx_veteran_leads_zip ON veteran_leads(zip);
CREATE INDEX IF NOT EXISTS idx_veteran_leads_readiness ON veteran_leads(readiness_score DESC);

-- Enable RLS
ALTER TABLE public.claim_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for claim_handoffs
CREATE POLICY "handoffs_select" ON public.claim_handoffs FOR SELECT
  USING (lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));
CREATE POLICY "handoffs_insert" ON public.claim_handoffs FOR INSERT WITH CHECK (true);
CREATE POLICY "handoffs_update" ON public.claim_handoffs FOR UPDATE
  USING (lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));

-- RLS policies for claim_events
CREATE POLICY "events_select" ON public.claim_events FOR SELECT
  USING (lead_id IN (SELECT id FROM veteran_leads WHERE user_id = auth.uid()));
CREATE POLICY "events_insert" ON public.claim_events FOR INSERT WITH CHECK (true);

-- Trigger for claim_handoffs updated_at
CREATE OR REPLACE FUNCTION update_claim_handoffs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claim_handoffs_updated_at
  BEFORE UPDATE ON claim_handoffs
  FOR EACH ROW EXECUTE FUNCTION update_claim_handoffs_timestamp();