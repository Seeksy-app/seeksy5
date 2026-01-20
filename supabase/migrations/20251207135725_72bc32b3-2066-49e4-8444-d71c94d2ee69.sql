-- Content Protection & Monitoring System

-- Protected content registry (proofs)
CREATE TABLE public.protected_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('audio', 'video', 'podcast_episode', 'recording')),
  original_file_url TEXT,
  file_hash TEXT NOT NULL,
  duration_seconds INTEGER,
  transcript TEXT,
  transcript_embedding JSONB, -- Store embedding as JSONB array
  audio_fingerprint_id TEXT, -- External fingerprint service ID (ACRCloud, etc.)
  blockchain_tx_hash TEXT,
  blockchain_certificate_url TEXT,
  proof_status TEXT NOT NULL DEFAULT 'pending' CHECK (proof_status IN ('pending', 'processing', 'verified', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monitoring sources (platforms to watch)
CREATE TABLE public.content_monitoring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify', 'instagram', 'facebook', 'tiktok', 'twitter', 'other')),
  platform_account_id TEXT,
  platform_account_url TEXT,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scanned_at TIMESTAMPTZ,
  scan_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content matches/detections
CREATE TABLE public.content_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protected_content_id UUID REFERENCES public.protected_content(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_url TEXT NOT NULL,
  external_title TEXT,
  external_channel_name TEXT,
  external_channel_url TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('audio_fingerprint', 'transcript_similarity', 'manual_report', 'ai_detection')),
  similarity_score DECIMAL(5,2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'exact')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'reviewed', 'confirmed_violation', 'false_positive', 'disputed', 'resolved')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scan jobs for background processing
CREATE TABLE public.content_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protected_content_id UUID REFERENCES public.protected_content(id) ON DELETE CASCADE,
  monitoring_source_id UUID REFERENCES public.content_monitoring_sources(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('fingerprint_scan', 'transcript_scan', 'full_scan')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  results_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.protected_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_monitoring_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_scan_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protected_content
CREATE POLICY "Users can view their own protected content"
  ON public.protected_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own protected content"
  ON public.protected_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own protected content"
  ON public.protected_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own protected content"
  ON public.protected_content FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_monitoring_sources
CREATE POLICY "Users can view their own monitoring sources"
  ON public.content_monitoring_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monitoring sources"
  ON public.content_monitoring_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring sources"
  ON public.content_monitoring_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitoring sources"
  ON public.content_monitoring_sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_matches
CREATE POLICY "Users can view their own matches"
  ON public.content_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own matches"
  ON public.content_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
  ON public.content_matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
  ON public.content_matches FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_scan_jobs
CREATE POLICY "Users can view their own scan jobs"
  ON public.content_scan_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan jobs"
  ON public.content_scan_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_protected_content_user ON public.protected_content(user_id);
CREATE INDEX idx_protected_content_status ON public.protected_content(proof_status);
CREATE INDEX idx_content_matches_user ON public.content_matches(user_id);
CREATE INDEX idx_content_matches_status ON public.content_matches(status);
CREATE INDEX idx_content_matches_platform ON public.content_matches(platform);
CREATE INDEX idx_content_scan_jobs_status ON public.content_scan_jobs(status);
CREATE INDEX idx_monitoring_sources_user ON public.content_monitoring_sources(user_id);

-- Updated_at triggers
CREATE TRIGGER update_protected_content_updated_at
  BEFORE UPDATE ON public.protected_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitoring_sources_updated_at
  BEFORE UPDATE ON public.content_monitoring_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_matches_updated_at
  BEFORE UPDATE ON public.content_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();