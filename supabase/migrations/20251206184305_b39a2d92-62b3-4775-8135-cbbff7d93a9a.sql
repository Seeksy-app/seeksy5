-- Email Signatures table (for Gmail tracking signatures)
CREATE TABLE public.email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.custom_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Signature',
  is_active BOOLEAN DEFAULT false,
  
  -- Block configuration (JSON array of blocks with order)
  blocks JSONB DEFAULT '[{"type":"profile","enabled":true},{"type":"company","enabled":true},{"type":"social","enabled":true},{"type":"banner","enabled":false}]'::jsonb,
  
  -- Individual block data
  quote_text TEXT,
  profile_photo_url TEXT,
  profile_name TEXT,
  profile_title TEXT,
  company_name TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  company_phone TEXT,
  company_address TEXT,
  
  -- Social links (stored as JSON for flexibility)
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- Banner
  banner_image_url TEXT,
  banner_cta_url TEXT,
  banner_alt_text TEXT,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Styling
  font_family TEXT DEFAULT 'Arial, sans-serif',
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#666666',
  link_color TEXT DEFAULT '#0066cc',
  
  -- Generated HTML cache
  html_signature TEXT,
  plain_text_signature TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Signature tracking events (separate from Resend email_events)
CREATE TABLE public.signature_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.custom_packages(id) ON DELETE SET NULL,
  signature_id UUID REFERENCES public.email_signatures(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL, -- 'open', 'banner_click', 'social_click', 'link_click'
  link_id TEXT, -- e.g., 'banner', 'facebook', 'linkedin', 'custom_1'
  target_url TEXT, -- The actual destination URL
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  email_client TEXT, -- 'gmail', 'outlook', 'apple_mail', etc.
  geo_city TEXT,
  geo_region TEXT,
  geo_country TEXT,
  
  -- Message tracking (for per-email tracking)
  message_key TEXT,
  recipient_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email notification preferences
CREATE TABLE public.signature_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.custom_packages(id) ON DELETE CASCADE,
  
  notify_on_open BOOLEAN DEFAULT true,
  notify_on_click BOOLEAN DEFAULT true,
  notify_on_banner_click BOOLEAN DEFAULT true,
  notify_on_social_click BOOLEAN DEFAULT false,
  
  notify_via_email BOOLEAN DEFAULT true,
  notify_via_browser BOOLEAN DEFAULT true,
  notify_via_app BOOLEAN DEFAULT true,
  
  -- Aggregation settings
  digest_mode BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, workspace_id)
);

-- API keys for Chrome extension
CREATE TABLE public.signature_extension_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.custom_packages(id) ON DELETE CASCADE,
  
  api_key TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT 'Chrome Extension',
  is_active BOOLEAN DEFAULT true,
  
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_email_signatures_workspace ON public.email_signatures(workspace_id);
CREATE INDEX idx_email_signatures_user ON public.email_signatures(user_id);
CREATE INDEX idx_email_signatures_active ON public.email_signatures(user_id, is_active) WHERE is_active = true;

CREATE INDEX idx_signature_tracking_events_signature ON public.signature_tracking_events(signature_id);
CREATE INDEX idx_signature_tracking_events_workspace ON public.signature_tracking_events(workspace_id);
CREATE INDEX idx_signature_tracking_events_type ON public.signature_tracking_events(event_type);
CREATE INDEX idx_signature_tracking_events_created ON public.signature_tracking_events(created_at DESC);
CREATE INDEX idx_signature_tracking_events_message ON public.signature_tracking_events(message_key) WHERE message_key IS NOT NULL;

CREATE INDEX idx_signature_extension_keys_user ON public.signature_extension_keys(user_id);
CREATE INDEX idx_signature_extension_keys_key ON public.signature_extension_keys(api_key);

-- Enable RLS
ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_extension_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_signatures
CREATE POLICY "Users can view own signatures"
  ON public.email_signatures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own signatures"
  ON public.email_signatures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
  ON public.email_signatures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
  ON public.email_signatures FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for signature_tracking_events
CREATE POLICY "Users can view own tracking events"
  ON public.signature_tracking_events FOR SELECT
  USING (auth.uid() = user_id);

-- Allow public inserts for tracking pixel/clicks (edge function handles auth)
CREATE POLICY "Allow tracking event inserts"
  ON public.signature_tracking_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification settings
CREATE POLICY "Users can view own notification settings"
  ON public.signature_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification settings"
  ON public.signature_notification_settings FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for extension keys
CREATE POLICY "Users can view own extension keys"
  ON public.signature_extension_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own extension keys"
  ON public.signature_extension_keys FOR ALL
  USING (auth.uid() = user_id);

-- Updated at triggers
CREATE TRIGGER update_email_signatures_updated_at
  BEFORE UPDATE ON public.email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signature_notification_settings_updated_at
  BEFORE UPDATE ON public.signature_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();