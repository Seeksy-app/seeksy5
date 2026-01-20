-- Veteran profiles table for logged-in users
CREATE TABLE public.veteran_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_status TEXT CHECK (service_status IN ('veteran', 'active_duty', 'guard_reserve', 'spouse_caregiver', 'federal_employee', 'other')),
  branch_of_service TEXT,
  service_start_date DATE,
  service_end_date DATE,
  has_intent_to_file BOOLEAN DEFAULT false,
  has_active_claim BOOLEAN DEFAULT false,
  last_claim_stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Claim sessions table
CREATE TABLE public.claim_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'initial_claim',
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'ready_for_partner', 'sent_to_partner', 'completed')),
  summary_notes JSONB DEFAULT '[]'::jsonb,
  ai_chat_log JSONB DEFAULT '[]'::jsonb,
  intake_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Calculator results table
CREATE TABLE public.calculator_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  calculator_type TEXT NOT NULL CHECK (calculator_type IN ('military_buyback', 'mra', 'sick_leave')),
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Claim partners table
CREATE TABLE public.claim_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  intake_webhook_url TEXT,
  states_served JSONB DEFAULT '[]'::jsonb,
  specialties JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Claim partner assignments table
CREATE TABLE public.claim_partner_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_session_id UUID NOT NULL REFERENCES public.claim_sessions(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.claim_partners(id) ON DELETE RESTRICT,
  assignment_reason TEXT DEFAULT 'default',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'acknowledged', 'in_review', 'completed'))
);

-- Enable RLS on all tables
ALTER TABLE public.veteran_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_partner_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for veteran_profiles
CREATE POLICY "Users can view own profile" ON public.veteran_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.veteran_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.veteran_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for claim_sessions
CREATE POLICY "Users can view own sessions" ON public.claim_sessions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert sessions" ON public.claim_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sessions" ON public.claim_sessions FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for calculator_results
CREATE POLICY "Users can view own results" ON public.calculator_results FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert results" ON public.calculator_results FOR INSERT WITH CHECK (true);

-- RLS policies for claim_partners (public read)
CREATE POLICY "Anyone can view active partners" ON public.claim_partners FOR SELECT USING (is_active = true);

-- RLS policies for claim_partner_assignments
CREATE POLICY "Users can view own assignments" ON public.claim_partner_assignments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.claim_sessions cs WHERE cs.id = claim_session_id AND (cs.user_id = auth.uid() OR cs.user_id IS NULL)));
CREATE POLICY "Anyone can insert assignments" ON public.claim_partner_assignments FOR INSERT WITH CHECK (true);

-- Seed a default claim partner
INSERT INTO public.claim_partners (name, contact_email, is_default, specialties, states_served) 
VALUES ('Veteran Claims Support', 'claims@example.com', true, '["VA Disability", "Intent to File", "Appeals"]', '["All States"]');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_veteran_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_veteran_profiles_updated_at BEFORE UPDATE ON public.veteran_profiles FOR EACH ROW EXECUTE FUNCTION update_veteran_updated_at();
CREATE TRIGGER update_claim_sessions_updated_at BEFORE UPDATE ON public.claim_sessions FOR EACH ROW EXECUTE FUNCTION update_veteran_updated_at();