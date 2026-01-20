
-- Market Intelligence Sources: Admin-curated list of trusted sources by category
CREATE TABLE public.market_intelligence_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('competitor', 'industry_publication', 'market_research', 'news', 'financial')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  refresh_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (refresh_frequency IN ('hourly', 'daily', 'weekly')),
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Intelligence Cache: Cached raw results from Firecrawl
CREATE TABLE public.market_intelligence_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.market_intelligence_sources(id) ON DELETE CASCADE,
  query TEXT,
  raw_content TEXT,
  content_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Intelligence Insights: AI-processed structured insights
CREATE TABLE public.market_intelligence_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.market_intelligence_sources(id) ON DELETE SET NULL,
  cache_id UUID REFERENCES public.market_intelligence_cache(id) ON DELETE SET NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('competitor_move', 'market_trend', 'pricing_update', 'funding_announcement', 'product_launch', 'industry_shift', 'regulatory_change')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_points JSONB DEFAULT '[]'::jsonb,
  source_url TEXT,
  source_name TEXT,
  relevance_score NUMERIC(3,2) DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  published_date TIMESTAMP WITH TIME ZONE,
  audience TEXT[] DEFAULT ARRAY['board', 'cfo', 'ceo']::TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Intelligence Jobs: Track scheduled fetch jobs
CREATE TABLE public.market_intelligence_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_refresh', 'source_refresh', 'search')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  source_id UUID REFERENCES public.market_intelligence_sources(id) ON DELETE CASCADE,
  query TEXT,
  results_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_intelligence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_intelligence_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin/Super Admin can manage sources
CREATE POLICY "Admins can manage sources"
  ON public.market_intelligence_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
    )
  );

-- Board and Admin can read insights
CREATE POLICY "Decision makers can read insights"
  ON public.market_intelligence_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'super_admin', 'board_member')
    )
  );

-- Admins can manage insights
CREATE POLICY "Admins can manage insights"
  ON public.market_intelligence_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
    )
  );

-- Cache accessible by admins
CREATE POLICY "Admins can manage cache"
  ON public.market_intelligence_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
    )
  );

-- Jobs accessible by admins
CREATE POLICY "Admins can manage jobs"
  ON public.market_intelligence_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
    )
  );

-- Indexes for performance
CREATE INDEX idx_market_intelligence_sources_category ON public.market_intelligence_sources(category);
CREATE INDEX idx_market_intelligence_sources_active ON public.market_intelligence_sources(is_active);
CREATE INDEX idx_market_intelligence_cache_expires ON public.market_intelligence_cache(expires_at);
CREATE INDEX idx_market_intelligence_insights_type ON public.market_intelligence_insights(insight_type);
CREATE INDEX idx_market_intelligence_insights_audience ON public.market_intelligence_insights USING GIN(audience);
CREATE INDEX idx_market_intelligence_insights_relevance ON public.market_intelligence_insights(relevance_score DESC);
CREATE INDEX idx_market_intelligence_insights_created ON public.market_intelligence_insights(created_at DESC);

-- Updated at triggers
CREATE TRIGGER update_market_intelligence_sources_updated_at
  BEFORE UPDATE ON public.market_intelligence_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_intelligence_insights_updated_at
  BEFORE UPDATE ON public.market_intelligence_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial sources (competitors and industry publications)
INSERT INTO public.market_intelligence_sources (name, url, category, description) VALUES
  ('Spotify for Podcasters', 'https://podcasters.spotify.com/resources', 'competitor', 'Spotify podcast platform updates and announcements'),
  ('Riverside.fm Blog', 'https://riverside.fm/blog', 'competitor', 'Riverside recording platform updates'),
  ('Restream Blog', 'https://restream.io/blog', 'competitor', 'Restream streaming platform news'),
  ('Podnews', 'https://podnews.net', 'industry_publication', 'Daily podcast industry news'),
  ('The Verge Tech', 'https://theverge.com/tech', 'news', 'Technology news and trends'),
  ('TechCrunch', 'https://techcrunch.com', 'news', 'Startup and technology news'),
  ('Creator Economy News', 'https://creatoreconomy.so', 'industry_publication', 'Creator economy insights and trends'),
  ('Edison Research', 'https://edisonresearch.com/category/podcasts', 'market_research', 'Podcast industry research and statistics');
