-- Face Identity table for storing face embeddings and verification status
CREATE TABLE public.face_identity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  face_hash TEXT,
  embedding_data JSONB,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'processing', 'verified', 'failed', 'revoked')),
  verification_method TEXT DEFAULT 'photos' CHECK (verification_method IN ('photos', 'video', 'live')),
  source_images TEXT[], -- Array of storage paths for uploaded photos
  metadata_uri TEXT,
  cert_tx_hash TEXT,
  cert_explorer_url TEXT,
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Face scan jobs for tracking YouTube/IG/TikTok scans
CREATE TABLE public.face_scan_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_frames_scanned INTEGER DEFAULT 0,
  matches_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Face matches found during scans
CREATE TABLE public.face_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_job_id UUID REFERENCES public.face_scan_jobs(id) ON DELETE CASCADE,
  appearance_id UUID REFERENCES public.guest_appearance_scans(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  video_url TEXT,
  video_title TEXT,
  thumbnail_url TEXT,
  timestamp_seconds INTEGER,
  confidence_score DECIMAL(5,4),
  frame_image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.face_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for face_identity
CREATE POLICY "Users can view their own face identity"
  ON public.face_identity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face identity"
  ON public.face_identity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face identity"
  ON public.face_identity FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for face_scan_jobs
CREATE POLICY "Users can view their own face scan jobs"
  ON public.face_scan_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face scan jobs"
  ON public.face_scan_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face scan jobs"
  ON public.face_scan_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for face_matches
CREATE POLICY "Users can view their own face matches"
  ON public.face_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own face matches"
  ON public.face_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own face matches"
  ON public.face_matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own face matches"
  ON public.face_matches FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_face_identity_user_id ON public.face_identity(user_id);
CREATE INDEX idx_face_identity_status ON public.face_identity(verification_status);
CREATE INDEX idx_face_scan_jobs_user_id ON public.face_scan_jobs(user_id);
CREATE INDEX idx_face_scan_jobs_status ON public.face_scan_jobs(status);
CREATE INDEX idx_face_matches_user_id ON public.face_matches(user_id);
CREATE INDEX idx_face_matches_scan_job ON public.face_matches(scan_job_id);

-- Updated at trigger
CREATE TRIGGER update_face_identity_updated_at
  BEFORE UPDATE ON public.face_identity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();