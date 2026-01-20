-- Interest Profiler (RIASEC) Assessment Tables

-- IP Items bank (60 items, 10 per RIASEC type)
CREATE TABLE public.ip_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  riasec_code CHAR(1) NOT NULL CHECK (riasec_code IN ('R', 'I', 'A', 'S', 'E', 'C')),
  prompt TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- IP Assessments
CREATE TABLE public.ip_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  mode TEXT NOT NULL DEFAULT 'standard' CHECK (mode IN ('short', 'standard')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  top_code_3 VARCHAR(3),
  scores_json JSONB,
  scoring_version TEXT NOT NULL DEFAULT '1.0',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- IP Responses (individual item answers)
CREATE TABLE public.ip_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.ip_assessments(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.ip_items(id) ON DELETE CASCADE,
  riasec_code CHAR(1) NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 4),
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, item_id)
);

-- IP Scores (computed per RIASEC type)
CREATE TABLE public.ip_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.ip_assessments(id) ON DELETE CASCADE,
  riasec_code CHAR(1) NOT NULL CHECK (riasec_code IN ('R', 'I', 'A', 'S', 'E', 'C')),
  raw_score INTEGER NOT NULL DEFAULT 0,
  normalized_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, riasec_code)
);

-- Enable RLS
ALTER TABLE public.ip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_scores ENABLE ROW LEVEL SECURITY;

-- IP Items policies (public read for active items)
CREATE POLICY "Anyone can view active IP items"
  ON public.ip_items FOR SELECT
  USING (is_active = true);

-- IP Assessments policies
CREATE POLICY "Users can view own IP assessments"
  ON public.ip_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own IP assessments"
  ON public.ip_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own IP assessments"
  ON public.ip_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- IP Responses policies
CREATE POLICY "Users can view own IP responses"
  ON public.ip_responses FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM public.ip_assessments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own IP responses"
  ON public.ip_responses FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.ip_assessments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own IP responses"
  ON public.ip_responses FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM public.ip_assessments WHERE user_id = auth.uid()
    )
  );

-- IP Scores policies
CREATE POLICY "Users can view own IP scores"
  ON public.ip_scores FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM public.ip_assessments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own IP scores"
  ON public.ip_scores FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM public.ip_assessments WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_ip_items_riasec ON public.ip_items(riasec_code);
CREATE INDEX idx_ip_items_order ON public.ip_items(display_order);
CREATE INDEX idx_ip_assessments_user ON public.ip_assessments(user_id);
CREATE INDEX idx_ip_responses_assessment ON public.ip_responses(assessment_id);
CREATE INDEX idx_ip_scores_assessment ON public.ip_scores(assessment_id);