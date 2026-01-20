-- Create guest_requests table for guest spot inquiries
CREATE TABLE IF NOT EXISTS public.guest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic_or_pitch TEXT,
  link TEXT,
  source TEXT DEFAULT 'landing_page' CHECK (source IN ('landing_page', 'studio_invite', 'event')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'declined', 'scheduled', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_guest_requests_creator_id ON public.guest_requests(creator_id);
CREATE INDEX idx_guest_requests_status ON public.guest_requests(status);
CREATE INDEX idx_guest_requests_created_at ON public.guest_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.guest_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Creators can view their own guest requests"
  ON public.guest_requests FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can create guest requests"
  ON public.guest_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update their own guest requests"
  ON public.guest_requests FOR UPDATE
  USING (auth.uid() = creator_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guest_requests_updated_at
  BEFORE UPDATE ON public.guest_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add smart CTA fields to landing_ctas table
ALTER TABLE public.landing_ctas 
  ADD COLUMN IF NOT EXISTS cta_category TEXT CHECK (cta_category IN ('meeting', 'event', 'signup_sheet', 'guest_request', 'custom')),
  ADD COLUMN IF NOT EXISTS linked_entity_id UUID,
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;