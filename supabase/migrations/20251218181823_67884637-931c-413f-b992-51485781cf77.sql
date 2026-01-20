-- Add provenance and review fields to trucking_carrier_leads
ALTER TABLE public.trucking_carrier_leads 
ADD COLUMN IF NOT EXISTS source_conversation_id text,
ADD COLUMN IF NOT EXISTS source_call_sid text,
ADD COLUMN IF NOT EXISTS intent_score numeric,
ADD COLUMN IF NOT EXISTS extracted_carrier_name text,
ADD COLUMN IF NOT EXISTS extracted_rate_offered numeric,
ADD COLUMN IF NOT EXISTS extracted_rate_requested numeric,
ADD COLUMN IF NOT EXISTS extracted_load_reference text,
ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS review_reason text;

-- Create index for deduplication by conversation_id
CREATE INDEX IF NOT EXISTS idx_carrier_leads_source_conversation_id 
ON public.trucking_carrier_leads(source_conversation_id) 
WHERE source_conversation_id IS NOT NULL;