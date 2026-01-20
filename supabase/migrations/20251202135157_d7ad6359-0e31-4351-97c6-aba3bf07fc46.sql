-- R&D Intelligence Feeds Tables

-- rd_feeds (blog/podcast research feeds)
CREATE TABLE public.rd_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('blog', 'podcast')),
  title TEXT NOT NULL,
  rss_url TEXT NOT NULL UNIQUE,
  category TEXT,
  trust_level TEXT NOT NULL DEFAULT 'medium' CHECK (trust_level IN ('high', 'medium', 'experimental')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- rd_feed_items (individual articles/episodes from feeds)
CREATE TABLE public.rd_feed_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.rd_feeds(id) ON DELETE CASCADE,
  item_guid TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  raw_content TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'episode')),
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feed_id, item_guid)
);

-- rd_transcripts (for podcast episodes)
CREATE TABLE public.rd_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_item_id UUID NOT NULL REFERENCES public.rd_feed_items(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  duration_seconds INTEGER,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- rd_insights (AI-extracted insights) - using TEXT for embedding instead of vector
CREATE TABLE public.rd_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_item_id UUID NOT NULL REFERENCES public.rd_feed_items(id) ON DELETE CASCADE,
  summary TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  stance TEXT,
  embedding_json TEXT,
  visibility TEXT NOT NULL DEFAULT 'internal_only' CHECK (visibility IN ('internal_only', 'board', 'public')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- rd_benchmarks (market benchmarks)
CREATE TABLE public.rd_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL,
  unit TEXT,
  time_window TEXT,
  source_notes TEXT,
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ai_agent_modes (store system prompts)
CREATE TABLE public.ai_agent_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode_name TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rd_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rd_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_modes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only for R&D data
CREATE POLICY "Admins can manage rd_feeds" ON public.rd_feeds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage rd_feed_items" ON public.rd_feed_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage rd_transcripts" ON public.rd_transcripts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage rd_insights" ON public.rd_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage rd_benchmarks" ON public.rd_benchmarks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage ai_agent_modes" ON public.ai_agent_modes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Seed the R&D Analyst system prompt
INSERT INTO public.ai_agent_modes (mode_name, system_prompt, description) VALUES (
  'rd_analyst',
  'You are the R&D Analyst for Seeksy. You have access to internal research tables including rd_feeds, rd_feed_items, rd_transcripts, rd_insights, and rd_benchmarks. Use rd_benchmarks as authoritative numeric values. Use rd_insights for narrative trends and supporting evidence. Never expose internal identifiers. Only reference human-readable feed titles and URLs. Summaries must be concise, analytical, and grounded in extracted insights. If confidence is low, state it. Your purpose is to surface market signals, performance benchmarks, CPM trends, creator economy shifts, and insights relevant to forecasting, GTM, and business model decisions.',
  'Internal R&D analyst mode for market research and benchmark analysis'
);

-- Seed initial benchmarks
INSERT INTO public.rd_benchmarks (metric_key, value, unit, time_window, source_notes, confidence) VALUES
  ('podcast_cpm_midroll_us', 25.00, 'USD', 'Q4 2024', 'IAB Podcast Advertising Report', 'high'),
  ('podcast_cpm_preroll', 18.00, 'USD', 'Q4 2024', 'IAB Podcast Advertising Report', 'high'),
  ('creator_sponsorship_rate_avg', 500.00, 'USD', 'Monthly', 'Internal creator data', 'medium'),
  ('ad_conversion_benchmark', 2.5, 'percent', 'Q4 2024', 'Industry average', 'medium'),
  ('creator_category_growth_rate', 15.0, 'percent', 'YoY', 'Market research', 'medium');

-- Update board_content with exact markdown
UPDATE public.board_content SET content = '# Business Model

## 1. Who We Serve
- Creators & Podcasters
- Influencers & Agencies
- Advertisers & Brands
- Events & Venues

## 2. Core Products
### Creator & Podcast Stack
- Creator profile + podcast streaming hub ("My Page")
- Studio + clip generator
- Audience analytics & CRM
Revenue: subscriptions + ad share

### Advertiser & Campaign Stack
- Campaign dashboard
- Creator & podcast discovery
- Attribution + reporting
Revenue: media margin + platform fees

### My Page Ad Layer
- Pre-roll, mid-roll, display, sponsor strips
Revenue: ad revenue share

### AI Agents & Automation
- Meeting assistant, content assistant, R&D assistant
Revenue: premium AI add-ons

## 3. How Money Flows
- Creator → monetization → revenue split
- Advertiser → campaigns → margin + fees

## 4. Strategic Moat
- R&D data advantage
- Unified stack
- AI-first workflows

## 5. Long-Term Upside
- Creator + advertiser graph
- Streaming surfaces
- Benchmark data products' WHERE page_slug = 'business-model';

UPDATE public.board_content SET content = '# Go-To-Market Strategy

## 1. Phases
### Phase 1 – Prove Model (0-6 months)
- Founding cohort
- Case studies, tight iteration

### Phase 2 – Playbook (6-18 months)
- Veteran, B2B/event speakers, niches
- FAM influencer days
- Creator-in-a-Box bundles

### Phase 3 – Scale (18-36 months)
- Media & ad-tech partnerships
- Agency integrations

## 2. Channels
- Creator acquisition (referrals, events, tools)
- Advertiser acquisition (direct, partnerships, case studies)

## 3. Positioning
Creators: "One home for content, monetization, and data."
Advertisers: "Performance media with real attribution."

## 4. Metrics
- Active creators
- Active advertisers
- Revenue per creator
- Inventory fill rate
- CPM/ROAS

## 5. R&D Differentiation
- Continuous ingestion of public data
- Identifies high-growth segments
- Feeds GTM + Forecast assumptions' WHERE page_slug = 'gtm';