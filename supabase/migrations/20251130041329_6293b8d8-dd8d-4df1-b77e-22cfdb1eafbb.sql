-- Create identity_requests table for advertiser access requests
CREATE TABLE IF NOT EXISTS public.identity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  advertiser_company TEXT NOT NULL,
  advertiser_website TEXT,
  advertiser_email TEXT NOT NULL,
  
  -- Requested rights (JSON array of requested identity types)
  rights_requested JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Request details
  campaign_name TEXT,
  campaign_description TEXT,
  duration_days INTEGER,
  budget_range TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  
  -- Response tracking
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_identity_requests_creator_id ON public.identity_requests(creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_identity_requests_advertiser_id ON public.identity_requests(advertiser_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_identity_requests_status ON public.identity_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_identity_requests_created_at ON public.identity_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.identity_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Creators can view their own requests
CREATE POLICY "Creators can view their own identity requests"
  ON public.identity_requests
  FOR SELECT
  USING (auth.uid() = creator_id);

-- RLS Policies: Creators can update their own requests (approve/reject)
CREATE POLICY "Creators can update their own identity requests"
  ON public.identity_requests
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies: Authenticated users can create identity requests
CREATE POLICY "Authenticated users can create identity requests"
  ON public.identity_requests
  FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

-- RLS Policies: Admins can view all requests
CREATE POLICY "Admins can view all identity requests"
  ON public.identity_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies: Admins can update all requests
CREATE POLICY "Admins can update all identity requests"
  ON public.identity_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_identity_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_identity_requests_updated_at
  BEFORE UPDATE ON public.identity_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_identity_requests_updated_at();

-- Add comment
COMMENT ON TABLE public.identity_requests IS 'Stores advertiser requests to use creator identity assets (face, voice, clips, AI likeness)';