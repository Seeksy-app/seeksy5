-- Create live_channels table for AWS IVS channel management
CREATE TABLE public.live_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  channel_arn TEXT,
  stream_key TEXT,
  ingest_endpoint TEXT,
  playback_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'starting', 'stopping')),
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own channels" 
ON public.live_channels 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channels" 
ON public.live_channels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels" 
ON public.live_channels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels" 
ON public.live_channels 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public can view active live channels for Seeksy TV
CREATE POLICY "Anyone can view active live channels" 
ON public.live_channels 
FOR SELECT 
USING (status = 'live' AND is_active = true);

-- Create index for performance
CREATE INDEX idx_live_channels_user_id ON public.live_channels(user_id);
CREATE INDEX idx_live_channels_status ON public.live_channels(status);

-- Add updated_at trigger
CREATE TRIGGER update_live_channels_updated_at
BEFORE UPDATE ON public.live_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_channels;