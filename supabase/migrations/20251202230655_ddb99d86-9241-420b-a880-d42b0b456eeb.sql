-- Studio Scenes table (for scene layouts)
CREATE TABLE IF NOT EXISTS public.studio_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.studio_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout_type TEXT NOT NULL DEFAULT 'host-only' CHECK (layout_type IN ('host-only', 'side-by-side', 'grid', 'presentation', 'pip', 'speaker-auto')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  overlays_json JSONB DEFAULT '[]'::jsonb,
  background_json JSONB DEFAULT '{}'::jsonb,
  lower_thirds_json JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Studio Assets table (logos, overlays, backgrounds, lower thirds)
CREATE TABLE IF NOT EXISTS public.studio_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'overlay', 'background', 'lower_third', 'banner', 'countdown', 'intro', 'outro')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Connected Channels table (streaming platforms)
CREATE TABLE IF NOT EXISTS public.connected_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'facebook', 'linkedin', 'tiktok', 'twitch', 'custom_rtmp')),
  provider_account_id TEXT,
  provider_account_name TEXT,
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  stream_key TEXT,
  rtmp_url TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_studio_scenes_session_id ON public.studio_scenes(session_id);
CREATE INDEX IF NOT EXISTS idx_studio_scenes_user_id ON public.studio_scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_assets_user_id ON public.studio_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_assets_type ON public.studio_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_connected_channels_user_id ON public.connected_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_channels_provider ON public.connected_channels(provider);

-- Enable RLS
ALTER TABLE public.studio_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for studio_scenes
CREATE POLICY "Users can view their own scenes"
  ON public.studio_scenes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scenes"
  ON public.studio_scenes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenes"
  ON public.studio_scenes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenes"
  ON public.studio_scenes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for studio_assets
CREATE POLICY "Users can view their own assets"
  ON public.studio_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assets"
  ON public.studio_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets"
  ON public.studio_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets"
  ON public.studio_assets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for connected_channels
CREATE POLICY "Users can view their own channels"
  ON public.connected_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channels"
  ON public.connected_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channels"
  ON public.connected_channels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channels"
  ON public.connected_channels FOR DELETE
  USING (auth.uid() = user_id);