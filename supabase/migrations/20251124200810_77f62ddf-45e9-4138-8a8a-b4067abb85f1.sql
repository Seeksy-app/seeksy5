-- Create investor_access table for secure sharing
CREATE TABLE IF NOT EXISTS public.investor_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  allowed_paths TEXT[] NOT NULL DEFAULT ARRAY['/investor/forecast', '/investor/models'],
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.investor_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own investor access codes
CREATE POLICY "Users can manage their own investor access"
  ON public.investor_access
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy: Public can validate access codes (for login)
CREATE POLICY "Public can validate access codes"
  ON public.investor_access
  FOR SELECT
  USING (is_active = true AND expires_at > now());

-- Create index for faster lookups
CREATE INDEX idx_investor_access_code ON public.investor_access(access_code) WHERE is_active = true;
CREATE INDEX idx_investor_access_user_id ON public.investor_access(user_id);

-- Function to generate random access code
CREATE OR REPLACE FUNCTION generate_investor_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;