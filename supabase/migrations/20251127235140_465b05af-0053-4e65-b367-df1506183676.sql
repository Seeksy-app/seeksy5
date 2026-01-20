-- Add email verification fields to podcasts table
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS verification_email TEXT,
ADD COLUMN IF NOT EXISTS verification_email_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_email_permanent BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.podcasts.verification_email IS 'Temporary email for RSS feed verification by podcast directories';
COMMENT ON COLUMN public.podcasts.verification_email_expires_at IS 'Expiration timestamp for temporary verification email';
COMMENT ON COLUMN public.podcasts.verification_email_permanent IS 'If true, verification email stays in feed indefinitely';