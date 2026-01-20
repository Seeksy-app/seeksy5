-- Add RSS Auto-Update System and Blockchain Certification tables

-- RSS Auto-Update System (references podcasts table which has user_id)
CREATE TABLE IF NOT EXISTS public.podcast_rss_auto_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  auto_update_enabled BOOLEAN DEFAULT true,
  last_update_at TIMESTAMPTZ,
  update_frequency TEXT DEFAULT 'on_publish' CHECK (update_frequency IN ('on_publish', 'daily', 'weekly')),
  directories JSONB DEFAULT '{"spotify": true, "apple": true, "google": true, "all_directories": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(podcast_id)
);

-- Blockchain certification for episodes
CREATE TABLE IF NOT EXISTS public.episode_blockchain_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  certificate_hash TEXT NOT NULL UNIQUE,
  blockchain_transaction_id TEXT,
  blockchain_network TEXT DEFAULT 'polygon' CHECK (blockchain_network IN ('polygon', 'ethereum', 'solana')),
  certificate_url TEXT,
  metadata JSONB,
  certified_at TIMESTAMPTZ DEFAULT now(),
  certificate_status TEXT DEFAULT 'verified' CHECK (certificate_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_podcast_rss_auto_updates_podcast_id ON public.podcast_rss_auto_updates(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episode_blockchain_certificates_episode_id ON public.episode_blockchain_certificates(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_blockchain_certificates_podcast_id ON public.episode_blockchain_certificates(podcast_id);

-- Enable RLS
ALTER TABLE public.podcast_rss_auto_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_blockchain_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for podcast_rss_auto_updates
CREATE POLICY "Users can view their RSS auto-update settings"
  ON public.podcast_rss_auto_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.podcasts p
      WHERE p.id = podcast_rss_auto_updates.podcast_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their RSS auto-update settings"
  ON public.podcast_rss_auto_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.podcasts p
      WHERE p.id = podcast_rss_auto_updates.podcast_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their RSS auto-update settings"
  ON public.podcast_rss_auto_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.podcasts p
      WHERE p.id = podcast_rss_auto_updates.podcast_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for episode_blockchain_certificates
CREATE POLICY "Users can view certificates for their episodes"
  ON public.episode_blockchain_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes e
      JOIN public.podcasts p ON e.podcast_id = p.id
      WHERE e.id = episode_blockchain_certificates.episode_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create certificates for their episodes"
  ON public.episode_blockchain_certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.episodes e
      JOIN public.podcasts p ON e.podcast_id = p.id
      WHERE e.id = episode_blockchain_certificates.episode_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view verified certificates"
  ON public.episode_blockchain_certificates FOR SELECT
  USING (certificate_status = 'verified');