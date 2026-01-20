-- AAR Core Table
CREATE TABLE public.aars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event Metadata
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'meeting', -- meeting, community_event, activation, conference, sponsorship
  event_date_start DATE,
  event_date_end DATE,
  time_window TEXT,
  location_venue TEXT,
  location_city_state TEXT,
  hosted_by TEXT,
  partner_organizations TEXT[],
  program_initiative TEXT,
  prepared_by TEXT,
  reporting_window TEXT,
  is_client_facing BOOLEAN DEFAULT false,
  
  -- Executive Summary
  executive_summary TEXT,
  
  -- Purpose & Strategic Alignment
  event_purpose TEXT,
  strategic_objectives TEXT[],
  brand_esg_gtm_alignment TEXT,
  not_designed_for_lead_gen BOOLEAN DEFAULT false,
  
  -- Event Summary & Stakeholders
  attendance_estimate INTEGER,
  key_stakeholders JSONB DEFAULT '[]'::jsonb, -- [{name, role, organization}]
  community_description TEXT,
  weather_environmental_notes TEXT,
  
  -- Wins & Impact (JSONB for flexible structure)
  wins_community_impact TEXT,
  wins_relationship_building TEXT,
  wins_business_support TEXT,
  wins_esg_execution TEXT,
  wins_civic_visibility TEXT,
  pull_quotes JSONB DEFAULT '[]'::jsonb, -- [{quote, attribution, section}]
  
  -- Metrics & Spend
  financial_spend JSONB DEFAULT '[]'::jsonb, -- [{category, amount, notes}]
  total_spend NUMERIC(12,2) DEFAULT 0,
  attendance_count INTEGER,
  engagement_scans INTEGER,
  engagement_interactions INTEGER,
  leads_generated INTEGER,
  funnel_views INTEGER,
  funnel_submissions INTEGER,
  cvr NUMERIC(5,2), -- conversion rate %
  cpl NUMERIC(10,2), -- cost per lead (auto-calculated)
  cltv_benchmark NUMERIC(12,2),
  roi_summary TEXT,
  
  -- Opportunities & Recommendations
  recommendations_repeat TEXT[],
  recommendations_expand TEXT[],
  recommendations_improve TEXT[],
  future_partnership_ideas TEXT[],
  
  -- Final Assessment
  final_assessment TEXT,
  
  -- Status & Sharing
  status TEXT DEFAULT 'draft', -- draft, review, published
  visibility TEXT DEFAULT 'internal', -- internal, client_shareable, public_case_study
  share_slug TEXT UNIQUE,
  share_password_hash TEXT,
  
  -- Generated Content
  generated_blog TEXT,
  generated_linkedin_article TEXT,
  generated_linkedin_post TEXT,
  generated_facebook_post TEXT,
  generated_instagram_caption TEXT,
  generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AAR Media Assets
CREATE TABLE public.aar_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aar_id UUID NOT NULL REFERENCES public.aars(id) ON DELETE CASCADE,
  
  media_type TEXT NOT NULL DEFAULT 'image', -- image, video, audio, document
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Metadata
  caption TEXT,
  alt_text TEXT,
  tooltip TEXT,
  seo_keywords TEXT[],
  platform_intent TEXT[], -- web, linkedin, press, client_pdf
  
  -- Placement
  section TEXT, -- which AAR section this belongs to
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_cover_image BOOLEAN DEFAULT false,
  
  -- Transcript (for audio/video)
  transcript TEXT,
  timestamp_highlights JSONB DEFAULT '[]'::jsonb, -- [{timestamp, note}]
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aar_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aars
CREATE POLICY "Users can view their own AARs" ON public.aars
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create AARs" ON public.aars
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own AARs" ON public.aars
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own AARs" ON public.aars
  FOR DELETE USING (auth.uid() = owner_id);

-- Public access for shared AARs
CREATE POLICY "Public can view shared AARs" ON public.aars
  FOR SELECT USING (
    visibility IN ('client_shareable', 'public_case_study') 
    AND share_slug IS NOT NULL 
    AND status = 'published'
  );

-- RLS Policies for aar_media
CREATE POLICY "Users can view their AAR media" ON public.aar_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.aars WHERE id = aar_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can create AAR media" ON public.aar_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.aars WHERE id = aar_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can update their AAR media" ON public.aar_media
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.aars WHERE id = aar_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can delete their AAR media" ON public.aar_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.aars WHERE id = aar_id AND owner_id = auth.uid())
  );

-- Public access for shared AAR media
CREATE POLICY "Public can view shared AAR media" ON public.aar_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.aars 
      WHERE id = aar_id 
      AND visibility IN ('client_shareable', 'public_case_study') 
      AND share_slug IS NOT NULL 
      AND status = 'published'
    )
  );

-- Storage bucket for AAR media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('aar-media', 'aar-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload AAR media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'aar-media' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view AAR media" ON storage.objects
  FOR SELECT USING (bucket_id = 'aar-media');

CREATE POLICY "Users can update their AAR media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'aar-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their AAR media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'aar-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update timestamp trigger
CREATE TRIGGER update_aars_updated_at
  BEFORE UPDATE ON public.aars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for share_slug lookups
CREATE INDEX idx_aars_share_slug ON public.aars(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_aars_owner ON public.aars(owner_id);
CREATE INDEX idx_aar_media_aar ON public.aar_media(aar_id);