-- Create listen_events table for tracking episode playback
CREATE TABLE IF NOT EXISTS public.listen_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  listen_duration_seconds INT NOT NULL DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  listener_ip_hash TEXT,
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_listen_events_episode_id ON public.listen_events(episode_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_podcast_id ON public.listen_events(podcast_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_creator_id ON public.listen_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_listened_at ON public.listen_events(listened_at);

-- Enable RLS
ALTER TABLE public.listen_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Creators can view their own listen events"
  ON public.listen_events FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Allow anonymous listen tracking"
  ON public.listen_events FOR INSERT
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.listen_events IS 'Tracks episode playback events for analytics and revenue calculation';