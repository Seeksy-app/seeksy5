-- ============================================
-- PHASE 2: AWARDS MODULE EXPANSION (FIXED)
-- ============================================

-- 1. Add new columns to awards_programs table (only ones that don't exist)
ALTER TABLE public.awards_programs 
ADD COLUMN IF NOT EXISTS anonymous_voting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_throttle_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ip_throttle_max_votes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS show_live_leaderboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ceremony_location TEXT,
ADD COLUMN IF NOT EXISTS ceremony_virtual_url TEXT,
ADD COLUMN IF NOT EXISTS judging_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS max_nominations_per_user INTEGER,
ADD COLUMN IF NOT EXISTS require_nomination_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ceremony_script TEXT,
ADD COLUMN IF NOT EXISTS ceremony_run_of_show JSONB DEFAULT '[]';

-- 2. Add new columns to award_categories table
ALTER TABLE public.award_categories 
ADD COLUMN IF NOT EXISTS eligibility_guidelines TEXT,
ADD COLUMN IF NOT EXISTS scoring_rubric JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS min_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT 'numeric' CHECK (scoring_type IN ('numeric', 'qualitative', 'weighted')),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS require_media BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allowed_media_types TEXT[] DEFAULT ARRAY['image', 'video', 'audio', 'pdf'],
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS judging_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add new columns to award_nominees table
ALTER TABLE public.award_nominees 
ADD COLUMN IF NOT EXISTS nomination_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_uploads JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS nomination_story TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS is_finalist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS finalist_rank INTEGER,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS custom_field_responses JSONB DEFAULT '{}';

-- 4. Create award_judges table
CREATE TABLE IF NOT EXISTS public.award_judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  bio TEXT,
  photo_url TEXT,
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  invite_accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'invited',
  assigned_categories UUID[] DEFAULT '{}',
  is_lead_judge BOOLEAN DEFAULT false,
  can_see_other_scores BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(program_id, email)
);

-- 5. Create award_judge_scores table
CREATE TABLE IF NOT EXISTS public.award_judge_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES public.award_nominees(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.award_judges(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  rubric_scores JSONB DEFAULT '{}',
  comments TEXT,
  private_notes TEXT,
  is_complete BOOLEAN DEFAULT false,
  scored_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(nominee_id, judge_id)
);

-- 6. Create award_judge_assignments table
CREATE TABLE IF NOT EXISTS public.award_judge_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judge_id UUID NOT NULL REFERENCES public.award_judges(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES public.award_nominees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  is_blind BOOLEAN DEFAULT true,
  UNIQUE(judge_id, nominee_id)
);

-- 7. Create award_voting_sessions table
CREATE TABLE IF NOT EXISTS public.award_voting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_token TEXT UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  votes_cast INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 8. Update award_votes table
ALTER TABLE public.award_votes 
ADD COLUMN IF NOT EXISTS voting_session_id UUID REFERENCES public.award_voting_sessions(id),
ADD COLUMN IF NOT EXISTS vote_weight DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 9. Create award_ceremony_elements table
CREATE TABLE IF NOT EXISTS public.award_ceremony_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL,
  category_id UUID REFERENCES public.award_categories(id) ON DELETE SET NULL,
  nominee_id UUID REFERENCES public.award_nominees(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT,
  duration_seconds INTEGER,
  speaker_notes TEXT,
  visual_cue TEXT,
  order_position INTEGER DEFAULT 0,
  is_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Create award_leaderboard_snapshots table
CREATE TABLE IF NOT EXISTS public.award_leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  rankings JSONB NOT NULL DEFAULT '[]',
  total_votes INTEGER DEFAULT 0
);

-- 11. Create award_nomination_drafts table
CREATE TABLE IF NOT EXISTS public.award_nomination_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.awards_programs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  user_id UUID,
  nominator_email TEXT,
  draft_data JSONB NOT NULL DEFAULT '{}',
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.award_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_ceremony_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_nomination_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for award_judges
CREATE POLICY "Program owners can manage judges" ON public.award_judges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_judges.program_id AND awards_programs.user_id = auth.uid())
  );

CREATE POLICY "Judges can view their own record" ON public.award_judges
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for award_judge_scores
CREATE POLICY "Judges can manage their own scores" ON public.award_judge_scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.award_judges WHERE award_judges.id = award_judge_scores.judge_id AND award_judges.user_id = auth.uid())
  );

CREATE POLICY "Program owners can view all scores" ON public.award_judge_scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_judge_scores.program_id AND awards_programs.user_id = auth.uid())
  );

-- RLS Policies for award_judge_assignments
CREATE POLICY "Program owners can manage assignments" ON public.award_judge_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.award_judges aj
      JOIN public.awards_programs ap ON ap.id = aj.program_id
      WHERE aj.id = award_judge_assignments.judge_id AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can view their assignments" ON public.award_judge_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.award_judges WHERE award_judges.id = award_judge_assignments.judge_id AND award_judges.user_id = auth.uid())
  );

-- RLS Policies for award_voting_sessions
CREATE POLICY "Anyone can create voting session" ON public.award_voting_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Program owners can view voting sessions" ON public.award_voting_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_voting_sessions.program_id AND awards_programs.user_id = auth.uid())
  );

-- RLS Policies for award_ceremony_elements
CREATE POLICY "Program owners can manage ceremony elements" ON public.award_ceremony_elements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_ceremony_elements.program_id AND awards_programs.user_id = auth.uid())
  );

-- RLS Policies for award_leaderboard_snapshots
CREATE POLICY "Program owners can manage leaderboard" ON public.award_leaderboard_snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_leaderboard_snapshots.program_id AND awards_programs.user_id = auth.uid())
  );

CREATE POLICY "Public can view leaderboard if enabled" ON public.award_leaderboard_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.awards_programs WHERE awards_programs.id = award_leaderboard_snapshots.program_id AND awards_programs.show_live_leaderboard = true)
  );

-- RLS Policies for award_nomination_drafts
CREATE POLICY "Users can manage their own drafts" ON public.award_nomination_drafts
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_award_judges_program ON public.award_judges(program_id);
CREATE INDEX IF NOT EXISTS idx_award_judges_user ON public.award_judges(user_id);
CREATE INDEX IF NOT EXISTS idx_award_judges_token ON public.award_judges(invite_token);
CREATE INDEX IF NOT EXISTS idx_award_judge_scores_nominee ON public.award_judge_scores(nominee_id);
CREATE INDEX IF NOT EXISTS idx_award_judge_scores_judge ON public.award_judge_scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_award_voting_sessions_program ON public.award_voting_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_award_voting_sessions_token ON public.award_voting_sessions(verification_token);
CREATE INDEX IF NOT EXISTS idx_award_ceremony_elements_program ON public.award_ceremony_elements(program_id);
CREATE INDEX IF NOT EXISTS idx_award_leaderboard_program_category ON public.award_leaderboard_snapshots(program_id, category_id);
CREATE INDEX IF NOT EXISTS idx_awards_programs_slug ON public.awards_programs(slug);

-- Create function to calculate average judge scores
CREATE OR REPLACE FUNCTION calculate_nominee_average_score(p_nominee_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_score DECIMAL;
BEGIN
  SELECT AVG(score) INTO avg_score
  FROM public.award_judge_scores
  WHERE nominee_id = p_nominee_id AND is_complete = true;
  
  RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to generate judge invite token
CREATE OR REPLACE FUNCTION generate_judge_invite_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate judge invite token
CREATE OR REPLACE FUNCTION set_judge_invite_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_token IS NULL THEN
    NEW.invite_token := generate_judge_invite_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_judge_invite_token ON public.award_judges;
CREATE TRIGGER trigger_set_judge_invite_token
  BEFORE INSERT ON public.award_judges
  FOR EACH ROW
  EXECUTE FUNCTION set_judge_invite_token();