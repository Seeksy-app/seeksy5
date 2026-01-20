-- Create table for voice blockchain certificates
CREATE TABLE IF NOT EXISTS public.voice_blockchain_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_profile_id UUID NOT NULL REFERENCES public.creator_voice_profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  voice_fingerprint_hash TEXT NOT NULL,
  blockchain_network TEXT NOT NULL DEFAULT 'polygon',
  token_id TEXT NOT NULL UNIQUE,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  nft_metadata JSONB,
  certification_status TEXT NOT NULL DEFAULT 'pending',
  gas_sponsored BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_blockchain_certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can view their own certificates
CREATE POLICY "Creators can view their own certificates"
  ON public.voice_blockchain_certificates
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Policy: System can insert certificates (via edge function with service role)
CREATE POLICY "System can insert certificates"
  ON public.voice_blockchain_certificates
  FOR INSERT
  WITH CHECK (true);

-- Policy: Creators can update their own certificates
CREATE POLICY "Creators can update their own certificates"
  ON public.voice_blockchain_certificates
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Create index for faster lookups
CREATE INDEX idx_voice_blockchain_certs_profile ON public.voice_blockchain_certificates(voice_profile_id);
CREATE INDEX idx_voice_blockchain_certs_creator ON public.voice_blockchain_certificates(creator_id);
CREATE INDEX idx_voice_blockchain_certs_token ON public.voice_blockchain_certificates(token_id);

-- Add updated_at trigger
CREATE TRIGGER update_voice_blockchain_certificates_updated_at
  BEFORE UPDATE ON public.voice_blockchain_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();