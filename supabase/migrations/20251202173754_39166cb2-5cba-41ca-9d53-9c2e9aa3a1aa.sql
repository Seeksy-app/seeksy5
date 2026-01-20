-- Create facebook_oauth_sessions table for multi-page selection
CREATE TABLE public.facebook_oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pages JSONB NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.facebook_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
CREATE POLICY "Users can view their own facebook sessions"
ON public.facebook_oauth_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Index for cleanup and lookup
CREATE INDEX idx_facebook_oauth_sessions_created_at ON public.facebook_oauth_sessions(created_at);
CREATE INDEX idx_facebook_oauth_sessions_user_id ON public.facebook_oauth_sessions(user_id);