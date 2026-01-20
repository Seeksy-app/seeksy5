-- Create veteran_kb_articles table for YourBenefits AI Agent knowledge base
CREATE TABLE public.veteran_kb_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  source_url TEXT,
  source_name TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.veteran_kb_articles ENABLE ROW LEVEL SECURITY;

-- Public read policy for published articles
CREATE POLICY "Anyone can view published veteran KB articles"
ON public.veteran_kb_articles
FOR SELECT
USING (is_published = true);

-- Admin policy for all operations (using user_roles table)
CREATE POLICY "Admins can manage veteran KB articles"
ON public.veteran_kb_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create index for search
CREATE INDEX idx_veteran_kb_articles_category ON public.veteran_kb_articles(category);
CREATE INDEX idx_veteran_kb_articles_tags ON public.veteran_kb_articles USING GIN(tags);
CREATE INDEX idx_veteran_kb_articles_search ON public.veteran_kb_articles USING GIN(to_tsvector('english', title || ' ' || content));

-- Add trigger for updated_at
CREATE TRIGGER update_veteran_kb_articles_updated_at
BEFORE UPDATE ON public.veteran_kb_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();