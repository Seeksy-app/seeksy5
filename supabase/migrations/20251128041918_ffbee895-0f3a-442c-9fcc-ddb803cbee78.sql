-- Create my_page_sections table for section ordering and configuration
CREATE TABLE IF NOT EXISTS public.my_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.my_page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sections"
  ON public.my_page_sections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sections"
  ON public.my_page_sections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sections"
  ON public.my_page_sections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sections"
  ON public.my_page_sections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for ordering
CREATE INDEX idx_my_page_sections_user_order ON public.my_page_sections(user_id, display_order);

-- Create NFC waitlist table
CREATE TABLE IF NOT EXISTS public.nfc_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nfc_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist entries"
  ON public.nfc_waitlist
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist entries"
  ON public.nfc_waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add tagline field to profiles for My Page
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_my_page_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER my_page_sections_updated_at
  BEFORE UPDATE ON public.my_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_my_page_sections_updated_at();