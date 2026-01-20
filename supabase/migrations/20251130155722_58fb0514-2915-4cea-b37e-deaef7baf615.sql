-- Add cert_explorer_url column to voice_blockchain_certificates table
ALTER TABLE voice_blockchain_certificates
ADD COLUMN IF NOT EXISTS cert_explorer_url TEXT;