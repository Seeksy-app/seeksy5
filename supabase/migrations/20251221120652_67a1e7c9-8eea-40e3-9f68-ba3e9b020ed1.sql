-- Create seo_metric_baselines table
CREATE TABLE public.seo_metric_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seo_page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('gsc', 'ga4')),
  baseline_clicks INTEGER,
  baseline_impressions INTEGER,
  baseline_ctr NUMERIC(5,4),
  baseline_position NUMERIC(5,2),
  baseline_users INTEGER,
  baseline_sessions INTEGER,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reset_by UUID REFERENCES auth.users(id),
  reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seo_page_id, source)
);

-- Enable RLS
ALTER TABLE public.seo_metric_baselines ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view baselines"
  ON public.seo_metric_baselines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert baselines"
  ON public.seo_metric_baselines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update baselines"
  ON public.seo_metric_baselines
  FOR UPDATE
  TO authenticated
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_seo_metric_baselines_page_source ON public.seo_metric_baselines(seo_page_id, source);