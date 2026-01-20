-- Drop existing status check constraint
ALTER TABLE public.legal_doc_instances DROP CONSTRAINT IF EXISTS legal_doc_instances_status_check;

-- Add updated status check constraint with 'pending' status
ALTER TABLE public.legal_doc_instances ADD CONSTRAINT legal_doc_instances_status_check 
  CHECK (status = ANY (ARRAY['draft', 'pending', 'submitted', 'admin_review', 'purchaser_signed', 'finalized']));

-- Update existing submitted instances that haven't been signed to pending
UPDATE public.legal_doc_instances 
SET status = 'pending' 
WHERE status = 'submitted' AND purchaser_signature_url IS NULL;