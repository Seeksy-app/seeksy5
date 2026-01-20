-- Create youtube_oauth_sessions table for temporary multi-channel selection
CREATE TABLE public.youtube_oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channels JSONB NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.youtube_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
CREATE POLICY "Users can view their own youtube sessions"
ON public.youtube_oauth_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Sessions expire after 10 minutes - index for cleanup
CREATE INDEX idx_youtube_oauth_sessions_created_at ON public.youtube_oauth_sessions(created_at);
CREATE INDEX idx_youtube_oauth_sessions_user_id ON public.youtube_oauth_sessions(user_id);