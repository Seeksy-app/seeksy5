-- Profile Image Scanner for Impersonation Detection
CREATE TABLE IF NOT EXISTS public.profile_image_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'instagram', 'tiktok'
  scan_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  profiles_scanned INTEGER DEFAULT 0,
  matches_found INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_image_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.profile_image_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_url TEXT,
  profile_image_url TEXT,
  match_confidence NUMERIC(5,2), -- 0-100 score
  match_type TEXT DEFAULT 'impersonation', -- 'impersonation', 'fan_account', 'verified'
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'reported', 'dismissed'
  notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agency system for influencer marketplace
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agency_saved_creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  discovery_profile_id UUID REFERENCES public.agency_discovery_profiles(id) ON DELETE CASCADE,
  list_name TEXT DEFAULT 'Saved',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agency_id, discovery_profile_id)
);

CREATE TABLE IF NOT EXISTS public.agency_creator_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  discovery_profile_id UUID REFERENCES public.agency_discovery_profiles(id),
  email TEXT,
  platform TEXT,
  username TEXT,
  invite_token TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'accepted', 'declined', 'expired'
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add face verification columns to agency_discovery_profiles
ALTER TABLE public.agency_discovery_profiles 
ADD COLUMN IF NOT EXISTS is_seeksy_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seeksy_user_id UUID,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.profile_image_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_image_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_creator_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_image_scans
CREATE POLICY "Users can view their own scans" ON public.profile_image_scans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scans" ON public.profile_image_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scans" ON public.profile_image_scans
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for profile_image_matches
CREATE POLICY "Users can view their own matches" ON public.profile_image_matches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own matches" ON public.profile_image_matches
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for agencies
CREATE POLICY "Users can view their own agencies" ON public.agencies
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create agencies" ON public.agencies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own agencies" ON public.agencies
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for agency_saved_creators
CREATE POLICY "Agency owners can manage saved creators" ON public.agency_saved_creators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agencies WHERE id = agency_id AND owner_id = auth.uid())
  );

-- RLS Policies for agency_creator_invites
CREATE POLICY "Agency owners can manage invites" ON public.agency_creator_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agencies WHERE id = agency_id AND owner_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_image_scans_user ON public.profile_image_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_image_matches_user ON public.profile_image_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_image_matches_scan ON public.profile_image_matches(scan_id);
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agency_discovery_seeksy ON public.agency_discovery_profiles(is_seeksy_verified);
CREATE INDEX IF NOT EXISTS idx_agency_creator_invites_token ON public.agency_creator_invites(invite_token);