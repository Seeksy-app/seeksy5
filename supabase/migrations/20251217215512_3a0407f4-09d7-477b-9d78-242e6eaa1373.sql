-- Trucking AI Call Performance (CEI) System Tables

-- 1. Main calls table (source of truth for each call)
CREATE TABLE public.trucking_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  call_provider TEXT,
  call_external_id TEXT,
  agent_name TEXT NOT NULL DEFAULT 'Jess',
  caller_phone TEXT,
  mc_number TEXT,
  company_name TEXT,
  primary_load_id TEXT,
  load_ids_discussed JSONB DEFAULT '[]'::jsonb,
  transcript_text TEXT,
  call_outcome TEXT NOT NULL DEFAULT 'incomplete' CHECK (call_outcome IN ('confirmed', 'declined', 'callback_requested', 'incomplete', 'error')),
  handoff_requested BOOLEAN NOT NULL DEFAULT false,
  handoff_reason TEXT,
  lead_created BOOLEAN NOT NULL DEFAULT false,
  lead_create_error TEXT,
  cei_score INT NOT NULL DEFAULT 100,
  cei_band TEXT NOT NULL DEFAULT '90-100' CHECK (cei_band IN ('90-100', '75-89', '50-74', '25-49', '0-24')),
  cei_reasons JSONB DEFAULT '[]'::jsonb,
  owner_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  flagged_for_coaching BOOLEAN DEFAULT false,
  internal_notes TEXT
);

-- 2. Event stream table for CEI scoring + analytics
CREATE TABLE public.trucking_call_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.trucking_calls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'load_lookup_started', 'load_lookup_success', 'load_lookup_failed',
    'alternate_load_requested', 'alternate_load_provided',
    'rate_quoted', 'rate_negotiation_requested', 'rate_increment_offered', 'rate_floor_reached',
    'booking_interest_confirmed',
    'info_requested_mc', 'info_provided_mc',
    'info_requested_company', 'info_provided_company',
    'info_requested_phone', 'info_provided_phone',
    'repeat_back_verification_done',
    'dispatch_requested', 'human_requested',
    'impatience_phrase_detected', 'confusion_correction_detected', 'hard_frustration_detected',
    'caller_thanked', 'call_resolved_without_handoff',
    'lead_create_attempted', 'lead_create_success', 'lead_create_failed',
    'post_call_webhook_attempted', 'post_call_webhook_success', 'post_call_webhook_failed',
    'silence_timeout', 'agent_pause_detected'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error')),
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('agent', 'tool', 'system', 'classifier')),
  phrase TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  cei_delta INT DEFAULT 0
);

-- 3. Daily reports table
CREATE TABLE public.trucking_daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_calls INT NOT NULL DEFAULT 0,
  resolved_without_handoff_pct NUMERIC NOT NULL DEFAULT 0,
  handoff_requested_pct NUMERIC NOT NULL DEFAULT 0,
  lead_created_pct NUMERIC NOT NULL DEFAULT 0,
  avg_cei_score NUMERIC NOT NULL DEFAULT 0,
  cei_band_breakdown JSONB NOT NULL DEFAULT '{"90-100": 0, "75-89": 0, "50-74": 0, "25-49": 0, "0-24": 0}'::jsonb,
  top_frustration_phrases JSONB DEFAULT '[]'::jsonb,
  top_success_signals JSONB DEFAULT '[]'::jsonb,
  ai_summary_text TEXT NOT NULL DEFAULT '',
  ai_insights_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID REFERENCES auth.users(id),
  sent_to_dispatch_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_trucking_calls_created_at ON public.trucking_calls(created_at DESC);
CREATE INDEX idx_trucking_calls_outcome ON public.trucking_calls(call_outcome);
CREATE INDEX idx_trucking_calls_cei_band ON public.trucking_calls(cei_band);
CREATE INDEX idx_trucking_calls_owner ON public.trucking_calls(owner_id);
CREATE INDEX idx_trucking_call_events_call_id ON public.trucking_call_events(call_id);
CREATE INDEX idx_trucking_call_events_type ON public.trucking_call_events(event_type);
CREATE INDEX idx_trucking_daily_reports_date ON public.trucking_daily_reports(report_date DESC);

-- Enable RLS
ALTER TABLE public.trucking_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucking_call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucking_daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trucking_calls
CREATE POLICY "Users can view their own calls" ON public.trucking_calls
  FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert calls" ON public.trucking_calls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own calls" ON public.trucking_calls
  FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);

-- RLS Policies for trucking_call_events
CREATE POLICY "Users can view events for their calls" ON public.trucking_call_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trucking_calls WHERE id = call_id AND (owner_id = auth.uid() OR owner_id IS NULL))
  );

CREATE POLICY "Users can insert events" ON public.trucking_call_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for trucking_daily_reports
CREATE POLICY "Users can view their reports" ON public.trucking_daily_reports
  FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);

CREATE POLICY "Users can insert reports" ON public.trucking_daily_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their reports" ON public.trucking_daily_reports
  FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);