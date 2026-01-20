-- =============================================
-- GBP Manager Database Schema
-- Admin-only internal Google Business Profile management
-- =============================================

-- Table: gbp_connections
-- Stores connected Google accounts with OAuth tokens
CREATE TABLE public.gbp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  google_account_email TEXT NOT NULL,
  google_subject TEXT, -- OpenID sub claim
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error'))
);

-- Table: gbp_locations
-- Cached GBP locations synced from Google
CREATE TABLE public.gbp_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connection_id UUID NOT NULL REFERENCES public.gbp_connections(id) ON DELETE CASCADE,
  google_location_name TEXT NOT NULL, -- e.g. "locations/123456789"
  google_account_name TEXT, -- e.g. "accounts/123456789"
  title TEXT NOT NULL,
  store_code TEXT,
  address_json JSONB,
  phone TEXT,
  website TEXT,
  primary_category TEXT,
  description TEXT,
  regular_hours_json JSONB,
  special_hours_json JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT now()
);

-- Table: gbp_reviews
-- Cached reviews for the review inbox
CREATE TABLE public.gbp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connection_id UUID NOT NULL REFERENCES public.gbp_connections(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.gbp_locations(id) ON DELETE CASCADE,
  google_review_name TEXT NOT NULL, -- Google resource name
  reviewer_display_name TEXT,
  reviewer_profile_photo_url TEXT,
  star_rating INT CHECK (star_rating >= 1 AND star_rating <= 5),
  comment TEXT,
  create_time TIMESTAMPTZ,
  update_time TIMESTAMPTZ,
  has_reply BOOLEAN DEFAULT false,
  reply_comment TEXT,
  reply_update_time TIMESTAMPTZ,
  UNIQUE(google_review_name)
);

-- Table: gbp_audit_log
-- Comprehensive audit trail for all GBP operations
CREATE TABLE public.gbp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_id UUID REFERENCES public.gbp_connections(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.gbp_locations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- SYNC_READ, REPLY_REVIEW, UPDATE_HOURS, UPDATE_DESCRIPTION, OAUTH_CONNECT, OAUTH_DISCONNECT
  target_google_resource TEXT,
  request_json JSONB,
  response_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  duration_ms INT
);

-- Table: gbp_admin_settings
-- Feature flags and write-mode controls
CREATE TABLE public.gbp_admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  write_mode_enabled BOOLEAN NOT NULL DEFAULT false,
  write_mode_reason TEXT,
  write_mode_enabled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  write_mode_enabled_at TIMESTAMPTZ
);

-- Insert default settings row
INSERT INTO public.gbp_admin_settings (write_mode_enabled) VALUES (false);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_gbp_locations_connection_id ON public.gbp_locations(connection_id);
CREATE INDEX idx_gbp_reviews_location_id ON public.gbp_reviews(location_id);
CREATE INDEX idx_gbp_reviews_connection_id ON public.gbp_reviews(connection_id);
CREATE INDEX idx_gbp_reviews_star_rating ON public.gbp_reviews(star_rating);
CREATE INDEX idx_gbp_reviews_has_reply ON public.gbp_reviews(has_reply);
CREATE INDEX idx_gbp_audit_log_connection_id ON public.gbp_audit_log(connection_id);
CREATE INDEX idx_gbp_audit_log_action_type ON public.gbp_audit_log(action_type);
CREATE INDEX idx_gbp_audit_log_created_at ON public.gbp_audit_log(created_at DESC);

-- =============================================
-- Updated_at triggers
-- =============================================
CREATE OR REPLACE FUNCTION public.update_gbp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_gbp_connections_updated_at
  BEFORE UPDATE ON public.gbp_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_gbp_updated_at();

CREATE TRIGGER update_gbp_locations_updated_at
  BEFORE UPDATE ON public.gbp_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_gbp_updated_at();

CREATE TRIGGER update_gbp_reviews_updated_at
  BEFORE UPDATE ON public.gbp_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_gbp_updated_at();

CREATE TRIGGER update_gbp_admin_settings_updated_at
  BEFORE UPDATE ON public.gbp_admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_gbp_updated_at();

-- =============================================
-- Row Level Security (Admin-only)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.gbp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_admin_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_gbp_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- gbp_connections policies
CREATE POLICY "Admin can view all GBP connections" 
  ON public.gbp_connections FOR SELECT 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can insert GBP connections" 
  ON public.gbp_connections FOR INSERT 
  WITH CHECK (public.is_gbp_admin());

CREATE POLICY "Admin can update GBP connections" 
  ON public.gbp_connections FOR UPDATE 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can delete GBP connections" 
  ON public.gbp_connections FOR DELETE 
  USING (public.is_gbp_admin());

-- gbp_locations policies
CREATE POLICY "Admin can view all GBP locations" 
  ON public.gbp_locations FOR SELECT 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can insert GBP locations" 
  ON public.gbp_locations FOR INSERT 
  WITH CHECK (public.is_gbp_admin());

CREATE POLICY "Admin can update GBP locations" 
  ON public.gbp_locations FOR UPDATE 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can delete GBP locations" 
  ON public.gbp_locations FOR DELETE 
  USING (public.is_gbp_admin());

-- gbp_reviews policies
CREATE POLICY "Admin can view all GBP reviews" 
  ON public.gbp_reviews FOR SELECT 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can insert GBP reviews" 
  ON public.gbp_reviews FOR INSERT 
  WITH CHECK (public.is_gbp_admin());

CREATE POLICY "Admin can update GBP reviews" 
  ON public.gbp_reviews FOR UPDATE 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can delete GBP reviews" 
  ON public.gbp_reviews FOR DELETE 
  USING (public.is_gbp_admin());

-- gbp_audit_log policies
CREATE POLICY "Admin can view all GBP audit logs" 
  ON public.gbp_audit_log FOR SELECT 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can insert GBP audit logs" 
  ON public.gbp_audit_log FOR INSERT 
  WITH CHECK (public.is_gbp_admin());

-- gbp_admin_settings policies
CREATE POLICY "Admin can view GBP settings" 
  ON public.gbp_admin_settings FOR SELECT 
  USING (public.is_gbp_admin());

CREATE POLICY "Admin can update GBP settings" 
  ON public.gbp_admin_settings FOR UPDATE 
  USING (public.is_gbp_admin());