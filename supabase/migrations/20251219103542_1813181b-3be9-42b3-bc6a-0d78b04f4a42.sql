-- Create table for high intent keywords
CREATE TABLE public.trucking_high_intent_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL CHECK (keyword_type IN ('origin_city', 'destination_city', 'load_number', 'custom')),
  load_id UUID REFERENCES public.trucking_loads(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('day', (now() AT TIME ZONE 'America/Chicago') + INTERVAL '1 day') AT TIME ZONE 'America/Chicago')
);

-- Enable RLS
ALTER TABLE public.trucking_high_intent_keywords ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view high intent keywords"
ON public.trucking_high_intent_keywords
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert high intent keywords"
ON public.trucking_high_intent_keywords
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete high intent keywords"
ON public.trucking_high_intent_keywords
FOR DELETE
TO authenticated
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_trucking_high_intent_keywords_expires_at ON public.trucking_high_intent_keywords(expires_at);
CREATE INDEX idx_trucking_high_intent_keywords_keyword ON public.trucking_high_intent_keywords(keyword);

-- Function to clean up expired keywords (called at midnight CST)
CREATE OR REPLACE FUNCTION public.cleanup_expired_high_intent_keywords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trucking_high_intent_keywords
  WHERE expires_at <= now();
END;
$$;