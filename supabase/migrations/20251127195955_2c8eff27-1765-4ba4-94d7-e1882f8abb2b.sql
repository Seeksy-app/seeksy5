-- Voice listen analytics tracking
CREATE TABLE IF NOT EXISTS public.voice_listen_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  listener_ip_hash TEXT,
  country TEXT,
  city TEXT,
  platform TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice licensing proposals
CREATE TABLE IF NOT EXISTS public.voice_licensing_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  advertiser_id UUID REFERENCES public.advertisers(id),
  advertiser_name TEXT NOT NULL,
  advertiser_email TEXT NOT NULL,
  advertiser_company TEXT,
  proposed_price DECIMAL(10, 2) NOT NULL,
  usage_description TEXT NOT NULL,
  campaign_details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'counter_offered', 'expired')),
  counter_offer_price DECIMAL(10, 2),
  counter_offer_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social media voice detection
CREATE TABLE IF NOT EXISTS public.voice_social_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'spotify', 'twitter', 'facebook', 'other')),
  post_url TEXT,
  post_id TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_authorized BOOLEAN DEFAULT false,
  confidence_score DECIMAL(5, 2),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'unauthorized', 'disputed')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin notification queue for voice-related alerts
CREATE TABLE IF NOT EXISTS public.voice_admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_proposal', 'unauthorized_usage', 'proposal_accepted', 'proposal_declined', 'anomaly_detected')),
  creator_id UUID NOT NULL,
  voice_profile_id UUID REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  related_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_listen_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_licensing_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_social_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_listen_analytics
CREATE POLICY "Creators can view their own voice analytics"
  ON public.voice_listen_analytics FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert analytics"
  ON public.voice_listen_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for voice_licensing_proposals
CREATE POLICY "Creators can view their proposals"
  ON public.voice_licensing_proposals FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update their proposals"
  ON public.voice_licensing_proposals FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Advertisers can create proposals"
  ON public.voice_licensing_proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all proposals"
  ON public.voice_licensing_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for voice_social_detections
CREATE POLICY "Creators can view their social detections"
  ON public.voice_social_detections FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert detections"
  ON public.voice_social_detections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update verification status"
  ON public.voice_social_detections FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all detections"
  ON public.voice_social_detections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for voice_admin_notifications
CREATE POLICY "Admins can view all notifications"
  ON public.voice_admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can create notifications"
  ON public.voice_admin_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can mark notifications as read"
  ON public.voice_admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Indexes for performance
CREATE INDEX idx_voice_analytics_creator ON public.voice_listen_analytics(creator_id, listened_at DESC);
CREATE INDEX idx_voice_analytics_profile ON public.voice_listen_analytics(voice_profile_id);
CREATE INDEX idx_proposals_creator ON public.voice_licensing_proposals(creator_id, status);
CREATE INDEX idx_proposals_advertiser ON public.voice_licensing_proposals(advertiser_id);
CREATE INDEX idx_social_detections_creator ON public.voice_social_detections(creator_id, detected_at DESC);
CREATE INDEX idx_social_detections_profile ON public.voice_social_detections(voice_profile_id);
CREATE INDEX idx_admin_notif_unread ON public.voice_admin_notifications(is_read, created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_voice_proposals_updated_at
  BEFORE UPDATE ON public.voice_licensing_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_detections_updated_at
  BEFORE UPDATE ON public.voice_social_detections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();