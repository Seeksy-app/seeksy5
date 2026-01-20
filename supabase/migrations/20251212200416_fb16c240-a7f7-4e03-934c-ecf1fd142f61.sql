-- Add SignWell fields to legal_doc_instances
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS signwell_document_id TEXT,
ADD COLUMN IF NOT EXISTS signwell_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_legal_doc_instances_signwell_id 
ON public.legal_doc_instances(signwell_document_id);

-- Add comment for documentation
COMMENT ON COLUMN public.legal_doc_instances.signwell_document_id IS 'SignWell document ID for e-signature tracking';
COMMENT ON COLUMN public.legal_doc_instances.signwell_status IS 'Status from SignWell: pending, partially_signed, completed, declined';
COMMENT ON COLUMN public.legal_doc_instances.signed_pdf_url IS 'URL to the fully signed PDF document';