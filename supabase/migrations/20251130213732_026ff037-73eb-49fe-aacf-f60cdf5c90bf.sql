-- ENUM for voice certificate status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'voice_cert_status'
  ) THEN
    CREATE TYPE voice_cert_status AS ENUM ('pending', 'verified', 'revoked', 'failed');
  END IF;
END$$;

-- Add / standardize columns on voice_blockchain_certificates
ALTER TABLE voice_blockchain_certificates
  ADD COLUMN IF NOT EXISTS certification_status voice_cert_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS burn_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS burned_at TIMESTAMPTZ;

-- Migrate existing data: mark verified certificates as active
UPDATE voice_blockchain_certificates
SET 
  is_active = TRUE,
  certification_status = 'verified'
WHERE certification_status = 'verified'
  AND is_active IS NULL;

-- Ensure at most ONE active verified certificate per creator
-- (Postgres partial unique index)
DROP INDEX IF EXISTS unique_active_voice_cert_per_creator;
CREATE UNIQUE INDEX unique_active_voice_cert_per_creator
ON voice_blockchain_certificates(creator_id)
WHERE is_active = TRUE AND certification_status = 'verified';