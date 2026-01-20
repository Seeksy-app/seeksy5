-- Add blockchain certification fields to clips table
ALTER TABLE public.clips
  ADD COLUMN IF NOT EXISTS cert_status TEXT DEFAULT 'not_requested',
  ADD COLUMN IF NOT EXISTS cert_chain TEXT,
  ADD COLUMN IF NOT EXISTS cert_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS cert_token_id TEXT,
  ADD COLUMN IF NOT EXISTS cert_explorer_url TEXT,
  ADD COLUMN IF NOT EXISTS cert_created_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for cert_status enum values
ALTER TABLE public.clips
  DROP CONSTRAINT IF EXISTS clips_cert_status_check;

ALTER TABLE public.clips
  ADD CONSTRAINT clips_cert_status_check 
  CHECK (cert_status IN ('not_requested', 'pending', 'minting', 'minted', 'failed'));

-- Create index for faster certification status lookups
CREATE INDEX IF NOT EXISTS idx_clips_cert_status ON public.clips(cert_status);

-- Add comment for documentation
COMMENT ON COLUMN public.clips.cert_status IS 'Blockchain certification status: not_requested, pending, minting, minted, failed';
COMMENT ON COLUMN public.clips.cert_chain IS 'Blockchain network (e.g., polygon, base)';
COMMENT ON COLUMN public.clips.cert_tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN public.clips.cert_token_id IS 'NFT token ID';
COMMENT ON COLUMN public.clips.cert_explorer_url IS 'Block explorer URL for verification';