
-- Knowledge Blog Articles table
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal TEXT NOT NULL CHECK (portal IN ('admin', 'creator', 'board')),
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  purpose TEXT,
  expected_outcomes TEXT,
  key_takeaways TEXT[],
  execution_steps TEXT[],
  questions TEXT[],
  screenshot_urls TEXT[],
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(portal, slug)
);

-- Enable RLS
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Published articles are viewable by authenticated users"
ON public.knowledge_articles
FOR SELECT
USING (is_published = true AND auth.role() = 'authenticated');

-- Admin/staff can manage all articles
CREATE POLICY "Admins can manage all articles"
ON public.knowledge_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  )
);

-- Create indexes for performance
CREATE INDEX idx_knowledge_articles_portal ON public.knowledge_articles(portal);
CREATE INDEX idx_knowledge_articles_section ON public.knowledge_articles(section);
CREATE INDEX idx_knowledge_articles_slug ON public.knowledge_articles(portal, slug);
CREATE INDEX idx_knowledge_articles_created ON public.knowledge_articles(created_at DESC);

-- Full text search
ALTER TABLE public.knowledge_articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX idx_knowledge_articles_search ON public.knowledge_articles USING GIN(search_vector);

-- Trigger to update updated_at
CREATE TRIGGER update_knowledge_articles_updated_at
BEFORE UPDATE ON public.knowledge_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
