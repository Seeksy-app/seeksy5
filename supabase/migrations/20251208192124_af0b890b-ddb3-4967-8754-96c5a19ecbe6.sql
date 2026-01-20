-- Create TV Channels table
CREATE TABLE public.tv_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[],
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  follower_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add channel_id to tv_content
ALTER TABLE public.tv_content 
ADD COLUMN channel_id UUID REFERENCES public.tv_channels(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_tv_channels_slug ON public.tv_channels(slug);
CREATE INDEX idx_tv_channels_user_id ON public.tv_channels(user_id);
CREATE INDEX idx_tv_content_channel_id ON public.tv_content(channel_id);

-- Enable RLS
ALTER TABLE public.tv_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tv_channels
CREATE POLICY "Anyone can view active channels"
ON public.tv_channels
FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can create their own channels"
ON public.tv_channels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
ON public.tv_channels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
ON public.tv_channels
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tv_channels_updated_at
BEFORE UPDATE ON public.tv_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();