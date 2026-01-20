-- Create streaming destinations table for storing connected streaming platforms
CREATE TABLE public.streaming_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'facebook', 'linkedin', 'twitch', 'tiktok', 'instagram', 'x', 'rtmp_custom')),
  display_name TEXT NOT NULL,
  platform_meta JSONB DEFAULT '{}',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  is_active_default BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session destinations for per-session toggle state
CREATE TABLE public.session_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  destination_id UUID NOT NULL REFERENCES public.streaming_destinations(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, destination_id)
);

-- Enable RLS
ALTER TABLE public.streaming_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_destinations ENABLE ROW LEVEL SECURITY;

-- RLS policies for streaming_destinations
CREATE POLICY "Users can view their own destinations"
ON public.streaming_destinations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own destinations"
ON public.streaming_destinations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own destinations"
ON public.streaming_destinations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own destinations"
ON public.streaming_destinations FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for session_destinations
CREATE POLICY "Users can manage session destinations"
ON public.session_destinations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.streaming_destinations sd
    WHERE sd.id = destination_id AND sd.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_streaming_destinations_user_id ON public.streaming_destinations(user_id);
CREATE INDEX idx_session_destinations_session_id ON public.session_destinations(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_streaming_destinations_updated_at
BEFORE UPDATE ON public.streaming_destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();