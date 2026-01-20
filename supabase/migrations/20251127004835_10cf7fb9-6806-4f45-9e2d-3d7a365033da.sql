-- Enhanced Studio Sessions Table
CREATE TABLE IF NOT EXISTS public.studio_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.studio_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Broadcasting Settings
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Multi-Platform Settings
  broadcast_to_youtube BOOLEAN DEFAULT false,
  broadcast_to_spotify BOOLEAN DEFAULT false,
  broadcast_to_my_page BOOLEAN DEFAULT false,
  youtube_stream_key TEXT,
  spotify_stream_key TEXT,
  audio_only_mode BOOLEAN DEFAULT false,
  
  -- Monetization
  enable_tipping BOOLEAN DEFAULT true,
  enable_subscriptions BOOLEAN DEFAULT false,
  ticket_price DECIMAL(10,2),
  
  -- Analytics
  total_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Timeline Markers with Enhanced Types
CREATE TABLE IF NOT EXISTS public.studio_timeline_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Marker Details
  marker_type TEXT NOT NULL CHECK (marker_type IN ('ad_spot', 'broll', 'clip_highlight', 'chapter', 'poll', 'qa', 'sponsor_mention', 'lower_third')),
  timestamp_seconds INTEGER NOT NULL,
  duration_seconds INTEGER,
  
  -- Marker Data
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  triggered BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Slots Integration
CREATE TABLE IF NOT EXISTS public.studio_ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  marker_id UUID REFERENCES public.studio_timeline_markers(id),
  
  -- Ad Slot Details
  slot_type TEXT CHECK (slot_type IN ('pre_roll', 'mid_roll', 'post_roll', 'host_read')),
  timestamp_seconds INTEGER NOT NULL,
  duration_seconds INTEGER DEFAULT 30,
  
  -- Campaign Assignment
  assigned_campaign_id UUID REFERENCES public.ad_campaigns(id),
  ad_creative_id UUID REFERENCES public.ad_creatives(id),
  
  -- Host-Read Specific
  host_read_script TEXT,
  script_displayed BOOLEAN DEFAULT false,
  read_completed BOOLEAN DEFAULT false,
  
  -- Performance
  impressions_delivered INTEGER DEFAULT 0,
  click_through_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Live Chat & Interactions
CREATE TABLE IF NOT EXISTS public.studio_live_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  
  -- Message Details
  user_id UUID,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'reaction', 'tip', 'question')),
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Live Polls & Q&A
CREATE TABLE IF NOT EXISTS public.studio_live_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  marker_id UUID REFERENCES public.studio_timeline_markers(id),
  
  -- Poll Details
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  poll_type TEXT DEFAULT 'multiple_choice' CHECK (poll_type IN ('multiple_choice', 'open_ended', 'rating')),
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  results_visible BOOLEAN DEFAULT true,
  
  -- Analytics
  total_votes INTEGER DEFAULT 0,
  results JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- AI Transcription & Notes
CREATE TABLE IF NOT EXISTS public.studio_ai_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  
  -- Transcription Details
  timestamp_seconds INTEGER NOT NULL,
  speaker_id TEXT,
  text TEXT NOT NULL,
  confidence DECIMAL(3,2),
  
  -- AI Analysis
  is_key_moment BOOLEAN DEFAULT false,
  is_chapter_start BOOLEAN DEFAULT false,
  chapter_title TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clip Suggestions (AI Generated)
CREATE TABLE IF NOT EXISTS public.studio_clip_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  
  -- Clip Details
  start_timestamp_seconds INTEGER NOT NULL,
  end_timestamp_seconds INTEGER NOT NULL,
  suggested_title TEXT,
  reason TEXT,
  ai_confidence_score DECIMAL(3,2),
  
  -- Status
  accepted BOOLEAN DEFAULT false,
  created_as_clip BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Viewer Analytics
CREATE TABLE IF NOT EXISTS public.studio_viewer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.studio_broadcasts(id) ON DELETE CASCADE,
  
  -- Time Segmentation
  timestamp_seconds INTEGER NOT NULL,
  viewer_count INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  chat_messages_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  poll_votes_count INTEGER DEFAULT 0,
  tips_count INTEGER DEFAULT 0,
  
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_timeline_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_live_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_live_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_ai_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_clip_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_viewer_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for studio_broadcasts
CREATE POLICY "Users can view their own broadcasts" ON public.studio_broadcasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own broadcasts" ON public.studio_broadcasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own broadcasts" ON public.studio_broadcasts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for studio_timeline_markers
CREATE POLICY "Users can view their own markers" ON public.studio_timeline_markers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own markers" ON public.studio_timeline_markers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own markers" ON public.studio_timeline_markers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for studio_ad_slots (creators and advertisers)
CREATE POLICY "Users can view ad slots for their broadcasts" ON public.studio_ad_slots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create ad slots for their broadcasts" ON public.studio_ad_slots FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);

-- RLS Policies for studio_live_chat (public read for broadcast viewers)
CREATE POLICY "Anyone can view chat for active broadcasts" ON public.studio_live_chat FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND is_live = true)
);
CREATE POLICY "Users can send chat messages" ON public.studio_live_chat FOR INSERT WITH CHECK (true);

-- RLS Policies for studio_live_polls
CREATE POLICY "Users can view polls for their broadcasts" ON public.studio_live_polls FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create polls for their broadcasts" ON public.studio_live_polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);

-- RLS Policies for AI transcriptions and analytics (creator only)
CREATE POLICY "Users can view transcriptions for their broadcasts" ON public.studio_ai_transcriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);
CREATE POLICY "System can create transcriptions" ON public.studio_ai_transcriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view clip suggestions for their broadcasts" ON public.studio_clip_suggestions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);
CREATE POLICY "System can create clip suggestions" ON public.studio_clip_suggestions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view analytics for their broadcasts" ON public.studio_viewer_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.studio_broadcasts WHERE id = broadcast_id AND user_id = auth.uid())
);
CREATE POLICY "System can record analytics" ON public.studio_viewer_analytics FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_studio_broadcasts_user_live ON public.studio_broadcasts(user_id, is_live);
CREATE INDEX idx_studio_timeline_markers_broadcast ON public.studio_timeline_markers(broadcast_id, timestamp_seconds);
CREATE INDEX idx_studio_ad_slots_broadcast ON public.studio_ad_slots(broadcast_id, timestamp_seconds);
CREATE INDEX idx_studio_live_chat_broadcast ON public.studio_live_chat(broadcast_id, created_at DESC);
CREATE INDEX idx_studio_ai_transcriptions_broadcast ON public.studio_ai_transcriptions(broadcast_id, timestamp_seconds);
CREATE INDEX idx_studio_viewer_analytics_broadcast ON public.studio_viewer_analytics(broadcast_id, timestamp_seconds);