-- Voice Detection & Cross-Platform Monitoring System

-- 1. Voice Fingerprints Table (extends creator_voice_profiles)
CREATE TABLE IF NOT EXISTS public.voice_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  fingerprint_id TEXT NOT NULL, -- External service fingerprint ID or internal embedding reference
  fingerprint_data JSONB, -- Stores actual embedding data if kept internally
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Voice Monitoring Sources Table
CREATE TABLE IF NOT EXISTS public.voice_monitoring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN (
    'youtube', 'spotify', 'apple_podcasts', 'tiktok', 'instagram', 
    'seeksy_studio', 'seeksy_meetings', 'advertiser_upload', 'other'
  )),
  external_account_id TEXT, -- YouTube channel ID, podcast RSS URL, etc.
  channel_id TEXT,
  label TEXT, -- Human-friendly name
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Voice Detections Table
CREATE TABLE IF NOT EXISTS public.voice_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_fingerprint_id UUID REFERENCES public.voice_fingerprints(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN (
    'youtube', 'spotify', 'apple_podcasts', 'tiktok', 'instagram',
    'twitter', 'seeksy_studio', 'seeksy_meetings', 'advertiser_upload', 'other'
  )),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'podcast_episode', 'video', 'short_form', 'live_stream', 
    'ad', 'meeting_recording', 'upload', 'other'
  )),
  source_id TEXT, -- External reference: video ID, episode ID, file ID
  source_title TEXT,
  source_url TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_spoken_at_sec NUMERIC, -- Timestamp offset where voice first detected
  last_spoken_at_sec NUMERIC,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  usage_category TEXT CHECK (usage_category IN (
    'appearance', 'ad_read', 'narration', 'background', 'unknown'
  )) DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN (
    'unreviewed', 'reviewed', 'flagged', 'licensed', 'ignored'
  )),
  notes TEXT,
  raw_metadata JSONB DEFAULT '{}',
  linked_revenue_event_id UUID, -- Future link to revenue events
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_voice_fingerprints_user ON public.voice_fingerprints(user_id);
CREATE INDEX idx_voice_fingerprints_profile ON public.voice_fingerprints(voice_profile_id);
CREATE INDEX idx_voice_monitoring_sources_user ON public.voice_monitoring_sources(user_id);
CREATE INDEX idx_voice_monitoring_sources_platform ON public.voice_monitoring_sources(platform, is_active);
CREATE INDEX idx_voice_detections_user_date ON public.voice_detections(user_id, detected_at DESC);
CREATE INDEX idx_voice_detections_user_platform ON public.voice_detections(user_id, platform);
CREATE INDEX idx_voice_detections_status ON public.voice_detections(status);

-- Enable RLS
ALTER TABLE public.voice_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_monitoring_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_fingerprints
CREATE POLICY "Users can view their own voice fingerprints"
  ON public.voice_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice fingerprints"
  ON public.voice_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice fingerprints"
  ON public.voice_fingerprints FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for voice_monitoring_sources
CREATE POLICY "Users can view their own monitoring sources"
  ON public.voice_monitoring_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own monitoring sources"
  ON public.voice_monitoring_sources FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for voice_detections
CREATE POLICY "Users can view their own voice detections"
  ON public.voice_detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert voice detections"
  ON public.voice_detections FOR INSERT
  WITH CHECK (true); -- System service inserts

CREATE POLICY "Users can update their own voice detections"
  ON public.voice_detections FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voice_fingerprints_updated_at
  BEFORE UPDATE ON public.voice_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_monitoring_sources_updated_at
  BEFORE UPDATE ON public.voice_monitoring_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_detections_updated_at
  BEFORE UPDATE ON public.voice_detections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.voice_fingerprints IS 'Stores voice fingerprint embeddings for certified creator voices';
COMMENT ON TABLE public.voice_monitoring_sources IS 'Defines external sources (platforms/channels) to monitor for each user';
COMMENT ON TABLE public.voice_detections IS 'Logs each detection event where a certified voice is found across platforms';
COMMENT ON COLUMN public.voice_detections.linked_revenue_event_id IS 'Future link to revenue_events for licensing monetization';