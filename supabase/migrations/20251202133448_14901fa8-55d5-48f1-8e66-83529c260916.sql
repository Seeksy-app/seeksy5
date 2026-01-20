-- Board content table for markdown pages
CREATE TABLE IF NOT EXISTS public.board_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video progress tracking for board members
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  seconds_watched INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Board documents table
CREATE TABLE IF NOT EXISTS public.board_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Board metrics snapshot
CREATE TABLE IF NOT EXISTS public.board_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Super admin view mode preferences
CREATE TABLE IF NOT EXISTS public.admin_view_mode (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  view_as_board BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_view_mode ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_content
CREATE POLICY "Board members and admins can view board content"
  ON public.board_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('board_member', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage board content"
  ON public.board_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for video_progress
CREATE POLICY "Users can view own video progress"
  ON public.video_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own video progress"
  ON public.video_progress FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all video progress"
  ON public.video_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete video progress"
  ON public.video_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for board_documents
CREATE POLICY "Board members and admins can view board documents"
  ON public.board_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('board_member', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage board documents"
  ON public.board_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for board_metrics
CREATE POLICY "Board members and admins can view board metrics"
  ON public.board_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('board_member', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage board metrics"
  ON public.board_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_view_mode
CREATE POLICY "Users can view own view mode"
  ON public.admin_view_mode FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage own view mode"
  ON public.admin_view_mode FOR ALL
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_board_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_board_content_updated_at
  BEFORE UPDATE ON public.board_content
  FOR EACH ROW EXECUTE FUNCTION public.update_board_updated_at();

CREATE TRIGGER update_video_progress_updated_at
  BEFORE UPDATE ON public.video_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_board_updated_at();

CREATE TRIGGER update_board_documents_updated_at
  BEFORE UPDATE ON public.board_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_board_updated_at();

CREATE TRIGGER update_board_metrics_updated_at
  BEFORE UPDATE ON public.board_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_board_updated_at();

CREATE TRIGGER update_admin_view_mode_updated_at
  BEFORE UPDATE ON public.admin_view_mode
  FOR EACH ROW EXECUTE FUNCTION public.update_board_updated_at();

-- Seed initial board content pages
INSERT INTO public.board_content (page_slug, title, content) VALUES
('state-of-company', 'State of the Company', '## Current Status

Welcome to the Seeksy Board Portal. This section provides an overview of our current company status, recent milestones, and strategic priorities.

### Key Highlights
- Platform development on track
- Creator acquisition growing
- Advertiser pipeline building

*Last updated: December 2024*'),

('business-model', 'Business Model', '## Revenue Model

Seeksy operates a multi-sided marketplace connecting creators, advertisers, and audiences.

### Creator Monetization
- Subscription tiers
- Ad revenue sharing (70/30 split)
- Voice certification premium
- Digital product sales

### Advertiser Path
- Self-serve campaign creation
- CPM-based pricing
- Conversational AI ads
- Performance tracking

### My Page Streaming + Ad Tech
- Integrated streaming monetization
- Dynamic ad insertion
- Real-time analytics

### AI Automations
- Content repurposing
- Clip generation
- Transcription services

### LTV Analysis
- Creator LTV: $X over 24 months
- Influencer LTV: $X over 24 months

### Data & Attribution
- Cross-platform tracking
- Conversion attribution
- Audience insights'),

('gtm', 'Go-To-Market Strategy', '## GTM Strategy

### Influencer FAM Program
- Ambassador network
- Revenue sharing incentives
- Exclusive early access

### Conference & Industry Creator Program
- Event sponsorships
- Creator meetups
- Industry partnerships

### Podcast & Creator Ecosystem Acquisition
- RSS migration tools
- Import from competitors
- Seamless onboarding

### Advertiser Onboarding
- Self-serve platform
- Account management tier
- Performance guarantees

### B2B Partnerships
- Agency partnerships
- Enterprise solutions
- White-label options

### Product Launch Phases
1. Phase 1: Core platform (Complete)
2. Phase 2: Monetization tools (In Progress)
3. Phase 3: Enterprise features (Q2 2025)'),

('forecasts', 'Financial Forecasts', '## 3-Year AI-Generated Projections

Financial projections are generated using our AI forecasting engine based on current metrics and market analysis.

*View detailed projections in the interactive charts below.*'),

('docs', 'Board Documents', '## Important Documents

Access key company documents, reports, and resources below.

### Categories
- Financial Reports
- Legal Documents
- Strategic Plans
- Meeting Minutes')
ON CONFLICT (page_slug) DO NOTHING;

-- Seed initial board metrics
INSERT INTO public.board_metrics (metric_key, metric_value, metric_label, display_order) VALUES
('total_creators', '1,247', 'Total Creators', 1),
('monthly_active', '892', 'Monthly Active Users', 2),
('revenue_mtd', '$47,500', 'Revenue MTD', 3),
('growth_rate', '+23%', 'MoM Growth', 4)
ON CONFLICT DO NOTHING;