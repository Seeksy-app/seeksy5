-- Create table for creator voice fingerprints
CREATE TABLE public.creator_voice_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  audio_signature JSONB NOT NULL,
  recording_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_type TEXT NOT NULL CHECK (source_type IN ('studio_recording', 'livestream', 'upload')),
  source_id UUID,
  sample_duration_seconds INTEGER,
  confidence_score DECIMAL(5,4),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.creator_voice_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice fingerprints"
  ON public.creator_voice_fingerprints
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice fingerprints"
  ON public.creator_voice_fingerprints
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice fingerprints"
  ON public.creator_voice_fingerprints
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_voice_fingerprints_user_id ON public.creator_voice_fingerprints(user_id);
CREATE INDEX idx_voice_fingerprints_hash ON public.creator_voice_fingerprints(fingerprint_hash);

-- Add voice fingerprint columns to episode_blockchain_certificates
ALTER TABLE public.episode_blockchain_certificates
  ADD COLUMN voice_fingerprint_id UUID REFERENCES public.creator_voice_fingerprints(id),
  ADD COLUMN voice_verified BOOLEAN DEFAULT false;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_voice_fingerprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_voice_fingerprints_updated_at
  BEFORE UPDATE ON public.creator_voice_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_voice_fingerprints_updated_at();