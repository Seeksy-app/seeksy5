-- Create pixel_leads table for invisible tracking
CREATE TABLE IF NOT EXISTS public.pixel_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visitor identification
  visitor_ip_hash TEXT NOT NULL,
  visitor_id TEXT, -- Cookie-based visitor ID
  
  -- Contact info (from enrichment APIs or captured forms)
  email TEXT,
  name TEXT,
  company TEXT,
  phone TEXT,
  
  -- Behavioral data
  page_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  session_duration INTEGER, -- seconds
  page_views INTEGER DEFAULT 1,
  
  -- Geo data
  country TEXT,
  city TEXT,
  
  -- Metadata
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Enrichment status
  enrichment_status TEXT DEFAULT 'pending', -- pending, enriched, failed
  enrichment_data JSONB
);

-- Create index for fast lookups
CREATE INDEX idx_pixel_leads_creator ON public.pixel_leads(creator_id, last_seen_at DESC);
CREATE INDEX idx_pixel_leads_visitor ON public.pixel_leads(visitor_ip_hash, visitor_id);
CREATE INDEX idx_pixel_leads_email ON public.pixel_leads(email) WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE public.pixel_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Creators can only see their own leads
CREATE POLICY "Users can view their own pixel leads"
  ON public.pixel_leads FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can insert their own pixel leads"
  ON public.pixel_leads FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own pixel leads"
  ON public.pixel_leads FOR UPDATE
  USING (auth.uid() = creator_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pixel_leads_updated_at
  BEFORE UPDATE ON public.pixel_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();