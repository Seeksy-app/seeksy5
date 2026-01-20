-- Add chairman signature fields to legal_doc_instances
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS chairman_signature_url TEXT,
ADD COLUMN IF NOT EXISTS chairman_signed_at TIMESTAMPTZ;