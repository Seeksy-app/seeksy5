-- Create identity_assets table for face and voice identity management
CREATE TABLE IF NOT EXISTS public.identity_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('face_identity', 'voice_identity')),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Certification fields (same pattern as clips)
  cert_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (cert_status IN ('not_requested', 'pending', 'minting', 'minted', 'failed')),
  cert_chain TEXT,
  cert_tx_hash TEXT,
  cert_token_id TEXT,
  cert_explorer_url TEXT,
  cert_created_at TIMESTAMP WITH TIME ZONE,
  cert_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Identity-specific fields
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  permissions JSONB NOT NULL DEFAULT '{"clip_use": true, "ai_generation": false, "advertiser_access": false, "anonymous_training": false}'::jsonb,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create identity_access_requests table for advertiser access flow
CREATE TABLE IF NOT EXISTS public.identity_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_asset_id UUID NOT NULL REFERENCES public.identity_assets(id) ON DELETE CASCADE,
  advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create identity_access_logs table for tracking all identity events
CREATE TABLE IF NOT EXISTS public.identity_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_asset_id UUID NOT NULL REFERENCES public.identity_assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('certified', 'revoked', 'permission_changed', 'access_granted', 'access_denied', 'access_requested')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_identity_assets_user_id ON public.identity_assets(user_id);
CREATE INDEX idx_identity_assets_type ON public.identity_assets(type);
CREATE INDEX idx_identity_assets_cert_status ON public.identity_assets(cert_status);
CREATE INDEX idx_identity_access_requests_identity ON public.identity_access_requests(identity_asset_id);
CREATE INDEX idx_identity_access_requests_advertiser ON public.identity_access_requests(advertiser_id);
CREATE INDEX idx_identity_access_logs_identity ON public.identity_access_logs(identity_asset_id);

-- RLS Policies for identity_assets
ALTER TABLE public.identity_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own identity assets"
  ON public.identity_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert their own identity assets"
  ON public.identity_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update their own identity assets"
  ON public.identity_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can delete their own identity assets"
  ON public.identity_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all identity assets"
  ON public.identity_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all identity assets"
  ON public.identity_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for identity_access_requests
ALTER TABLE public.identity_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view requests for their identity"
  ON public.identity_access_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identity_assets
      WHERE identity_assets.id = identity_access_requests.identity_asset_id
      AND identity_assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Advertisers can view their own requests"
  ON public.identity_access_requests FOR SELECT
  USING (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can create requests"
  ON public.identity_access_requests FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Creators can update requests for their identity"
  ON public.identity_access_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.identity_assets
      WHERE identity_assets.id = identity_access_requests.identity_asset_id
      AND identity_assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all access requests"
  ON public.identity_access_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for identity_access_logs
ALTER TABLE public.identity_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view logs for their identity"
  ON public.identity_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.identity_assets
      WHERE identity_assets.id = identity_access_logs.identity_asset_id
      AND identity_assets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert logs"
  ON public.identity_access_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all logs"
  ON public.identity_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_identity_assets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_identity_assets_updated_at
  BEFORE UPDATE ON public.identity_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_identity_assets_updated_at();