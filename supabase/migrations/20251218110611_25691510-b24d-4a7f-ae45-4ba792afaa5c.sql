-- WIP Value table (6 values)
CREATE TABLE public.wip_value (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WIP Need table (21 needs mapped to 6 values)
CREATE TABLE public.wip_need (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  value_id UUID NOT NULL REFERENCES public.wip_value(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WIP Round table (configurable 21-round matrix)
CREATE TABLE public.wip_round (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_index INT NOT NULL CHECK (round_index >= 1 AND round_index <= 21),
  need_ids UUID[] NOT NULL CHECK (array_length(need_ids, 1) = 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_index, version)
);

-- WIP Assessment (one completed assessment per user/session)
CREATE TABLE public.wip_assessment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audience_path TEXT NOT NULL DEFAULT 'civilian' CHECK (audience_path IN ('civilian', 'military', 'reentry')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  version TEXT NOT NULL DEFAULT 'v1',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WIP Round Response (user rankings per round)
CREATE TABLE public.wip_round_response (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.wip_assessment(id) ON DELETE CASCADE,
  round_index INT NOT NULL CHECK (round_index >= 1 AND round_index <= 21),
  ranked_need_ids UUID[] NOT NULL CHECK (array_length(ranked_need_ids, 1) = 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, round_index)
);

-- WIP Need Score (computed scores per need)
CREATE TABLE public.wip_need_score (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.wip_assessment(id) ON DELETE CASCADE,
  need_id UUID NOT NULL REFERENCES public.wip_need(id) ON DELETE CASCADE,
  raw_score NUMERIC NOT NULL DEFAULT 0,
  std_score_0_100 NUMERIC NOT NULL DEFAULT 0,
  appearances INT NOT NULL DEFAULT 0,
  min_possible NUMERIC NOT NULL DEFAULT 0,
  max_possible NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, need_id)
);

-- WIP Value Score (computed scores per value)
CREATE TABLE public.wip_value_score (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.wip_assessment(id) ON DELETE CASCADE,
  value_id UUID NOT NULL REFERENCES public.wip_value(id) ON DELETE CASCADE,
  raw_sum NUMERIC NOT NULL DEFAULT 0,
  raw_mean NUMERIC NOT NULL DEFAULT 0,
  std_score_0_100 NUMERIC NOT NULL DEFAULT 0,
  min_possible NUMERIC NOT NULL DEFAULT 0,
  max_possible NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, value_id)
);

-- O*NET OU Profile for WIP matching (21-need vectors)
CREATE TABLE public.onet_ou_profile_wip (
  ou_code TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  job_zone INT NOT NULL CHECK (job_zone >= 1 AND job_zone <= 5),
  need_std_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WIP Match Result (computed matches per assessment)
CREATE TABLE public.wip_match_result (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.wip_assessment(id) ON DELETE CASCADE,
  ou_code TEXT NOT NULL REFERENCES public.onet_ou_profile_wip(ou_code) ON DELETE CASCADE,
  job_zone INT NOT NULL,
  correlation NUMERIC NOT NULL,
  is_minimum_match BOOLEAN NOT NULL DEFAULT false,
  is_strong_match BOOLEAN NOT NULL DEFAULT false,
  rank_within_job_zone INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wip_need_value ON public.wip_need(value_id);
CREATE INDEX idx_wip_round_response_assessment ON public.wip_round_response(assessment_id);
CREATE INDEX idx_wip_need_score_assessment ON public.wip_need_score(assessment_id);
CREATE INDEX idx_wip_value_score_assessment ON public.wip_value_score(assessment_id);
CREATE INDEX idx_wip_match_result_assessment ON public.wip_match_result(assessment_id);
CREATE INDEX idx_wip_match_result_job_zone ON public.wip_match_result(assessment_id, job_zone, rank_within_job_zone);
CREATE INDEX idx_onet_ou_profile_job_zone ON public.onet_ou_profile_wip(job_zone);

-- Enable RLS
ALTER TABLE public.wip_value ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_need ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_round ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_round_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_need_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_value_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_ou_profile_wip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wip_match_result ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "Public read wip_value" ON public.wip_value FOR SELECT USING (true);
CREATE POLICY "Public read wip_need" ON public.wip_need FOR SELECT USING (true);
CREATE POLICY "Public read wip_round" ON public.wip_round FOR SELECT USING (true);
CREATE POLICY "Public read onet_ou_profile_wip" ON public.onet_ou_profile_wip FOR SELECT USING (true);

-- User-scoped policies for assessment data
CREATE POLICY "Users can view own assessments" ON public.wip_assessment FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create assessments" ON public.wip_assessment FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own assessments" ON public.wip_assessment FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own round responses" ON public.wip_round_response FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));
CREATE POLICY "Users can create round responses" ON public.wip_round_response FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));

CREATE POLICY "Users can view own need scores" ON public.wip_need_score FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));
CREATE POLICY "Users can create need scores" ON public.wip_need_score FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));

CREATE POLICY "Users can view own value scores" ON public.wip_value_score FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));
CREATE POLICY "Users can create value scores" ON public.wip_value_score FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));

CREATE POLICY "Users can view own match results" ON public.wip_match_result FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));
CREATE POLICY "Users can create match results" ON public.wip_match_result FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.wip_assessment a WHERE a.id = assessment_id AND (a.user_id = auth.uid() OR a.user_id IS NULL)));

-- Seed 6 Work Values
INSERT INTO public.wip_value (code, label, description, sort_order) VALUES
('ACHIEVEMENT', 'Achievement', 'Occupations that satisfy this work value are results-oriented and allow employees to use their strongest abilities, giving them a feeling of accomplishment.', 1),
('RECOGNITION', 'Recognition', 'Occupations that satisfy this work value offer advancement, potential for leadership, and are often considered prestigious.', 2),
('INDEPENDENCE', 'Independence', 'Occupations that satisfy this work value allow employees to work on their own and make decisions.', 3),
('WORKING_CONDITIONS', 'Working Conditions', 'Occupations that satisfy this work value offer job security and good working conditions.', 4),
('RELATIONSHIPS', 'Relationships', 'Occupations that satisfy this work value allow employees to provide service to others and work with co-workers in a friendly non-competitive environment.', 5),
('SUPPORT', 'Support', 'Occupations that satisfy this work value offer supportive management that stands behind employees.', 6);

-- Seed 21 Work Needs (mapped to values)
INSERT INTO public.wip_need (code, label, description, value_id, sort_order)
SELECT 'ABILITY_UTILIZATION', 'Ability Utilization', 'Workers can make use of their individual abilities.', id, 1 FROM public.wip_value WHERE code = 'ACHIEVEMENT'
UNION ALL
SELECT 'ACHIEVEMENT', 'Achievement', 'Workers get a feeling of accomplishment.', id, 2 FROM public.wip_value WHERE code = 'ACHIEVEMENT'
UNION ALL
SELECT 'ADVANCEMENT', 'Advancement', 'Workers have opportunities for advancement.', id, 3 FROM public.wip_value WHERE code = 'RECOGNITION'
UNION ALL
SELECT 'AUTHORITY', 'Authority', 'Workers give directions and instructions to others.', id, 4 FROM public.wip_value WHERE code = 'RECOGNITION'
UNION ALL
SELECT 'RECOGNITION', 'Recognition', 'Workers receive recognition for the work they do.', id, 5 FROM public.wip_value WHERE code = 'RECOGNITION'
UNION ALL
SELECT 'SOCIAL_STATUS', 'Social Status', 'Workers are looked up to by others in their company and community.', id, 6 FROM public.wip_value WHERE code = 'RECOGNITION'
UNION ALL
SELECT 'AUTONOMY', 'Autonomy', 'Workers plan their work with little supervision.', id, 7 FROM public.wip_value WHERE code = 'INDEPENDENCE'
UNION ALL
SELECT 'CREATIVITY', 'Creativity', 'Workers try out their own ideas.', id, 8 FROM public.wip_value WHERE code = 'INDEPENDENCE'
UNION ALL
SELECT 'RESPONSIBILITY', 'Responsibility', 'Workers make decisions on their own.', id, 9 FROM public.wip_value WHERE code = 'INDEPENDENCE'
UNION ALL
SELECT 'ACTIVITY', 'Activity', 'Workers are busy all the time.', id, 10 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'COMPENSATION', 'Compensation', 'Workers are paid well in comparison with other workers.', id, 11 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'INDEPENDENCE', 'Independence', 'Workers do their work alone.', id, 12 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'SECURITY', 'Security', 'Workers have steady employment.', id, 13 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'VARIETY', 'Variety', 'Workers have something different to do every day.', id, 14 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'WORKING_CONDITIONS', 'Working Conditions', 'Workers have good working conditions.', id, 15 FROM public.wip_value WHERE code = 'WORKING_CONDITIONS'
UNION ALL
SELECT 'COWORKERS', 'Co-workers', 'Workers have co-workers who are easy to get along with.', id, 16 FROM public.wip_value WHERE code = 'RELATIONSHIPS'
UNION ALL
SELECT 'MORAL_VALUES', 'Moral Values', 'Workers are never pressured to do things that go against their sense of right and wrong.', id, 17 FROM public.wip_value WHERE code = 'RELATIONSHIPS'
UNION ALL
SELECT 'SOCIAL_SERVICE', 'Social Service', 'Workers do things for other people.', id, 18 FROM public.wip_value WHERE code = 'RELATIONSHIPS'
UNION ALL
SELECT 'COMPANY_POLICIES', 'Company Policies and Practices', 'Workers are treated fairly by the company.', id, 19 FROM public.wip_value WHERE code = 'SUPPORT'
UNION ALL
SELECT 'SUPERVISION_HR', 'Supervision - Human Relations', 'Workers have supervisors who back up their workers with management.', id, 20 FROM public.wip_value WHERE code = 'SUPPORT'
UNION ALL
SELECT 'SUPERVISION_TECH', 'Supervision - Technical', 'Workers have supervisors who train their workers well.', id, 21 FROM public.wip_value WHERE code = 'SUPPORT';