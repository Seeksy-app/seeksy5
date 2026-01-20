-- Add category column to knowledge_articles
ALTER TABLE public.knowledge_articles 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Seeksy Updates';

-- Create RSS sources table for content sourcing
CREATE TABLE IF NOT EXISTS public.blog_rss_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Industry Insights',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  fetch_frequency_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog insights table for extracted insights
CREATE TABLE IF NOT EXISTS public.blog_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'firecrawl',
  trending_topics JSONB DEFAULT '[]'::jsonb,
  sentiment TEXT,
  creator_opportunities JSONB DEFAULT '[]'::jsonb,
  revenue_trends JSONB DEFAULT '[]'::jsonb,
  strategic_implications JSONB DEFAULT '[]'::jsonb,
  cta_suggestions JSONB DEFAULT '[]'::jsonb,
  risk_notes JSONB DEFAULT '[]'::jsonb,
  raw_content TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog generation jobs table
CREATE TABLE IF NOT EXISTS public.blog_generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  portal TEXT NOT NULL,
  category TEXT NOT NULL,
  source_insight_ids UUID[] DEFAULT '{}',
  generated_article_id UUID REFERENCES public.knowledge_articles(id),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admins can manage RSS sources" ON public.blog_rss_sources
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage blog insights" ON public.blog_insights
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can manage generation jobs" ON public.blog_generation_jobs
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Public read for published articles
CREATE POLICY "Anyone can read published articles" ON public.knowledge_articles
FOR SELECT USING (is_published = true);

-- Seed default RSS sources
INSERT INTO public.blog_rss_sources (name, url, category) VALUES
  ('TechCrunch Creator Economy', 'https://techcrunch.com/tag/creator-economy/feed/', 'Industry Insights'),
  ('Tubefilter', 'https://www.tubefilter.com/feed/', 'Industry Insights'),
  ('Podnews', 'https://podnews.net/rss', 'Podcasting Industry'),
  ('YouTube Creator Blog', 'https://blog.youtube/creator-and-artist-stories/rss/', 'Creator Growth & Monetization'),
  ('Substack Discovery', 'https://on.substack.com/feed', 'Industry Insights'),
  ('Medium Creator Economy', 'https://medium.com/feed/tag/creator-economy', 'Creator Growth & Monetization')
ON CONFLICT (url) DO NOTHING;

-- Update trigger for RSS sources
CREATE OR REPLACE FUNCTION public.update_blog_rss_sources_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blog_rss_sources_updated_at
BEFORE UPDATE ON public.blog_rss_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_rss_sources_updated_at();