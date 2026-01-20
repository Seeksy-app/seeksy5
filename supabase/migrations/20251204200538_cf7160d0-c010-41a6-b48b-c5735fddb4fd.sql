-- Add lead magnet tracking fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS persona_segment text,
ADD COLUMN IF NOT EXISTS selected_offer_id text,
ADD COLUMN IF NOT EXISTS selected_offer_title text,
ADD COLUMN IF NOT EXISTS download_url text,
ADD COLUMN IF NOT EXISTS lead_magnet_sent_at timestamp with time zone;

-- Create lead_magnet_downloads table for tracking
CREATE TABLE IF NOT EXISTS public.lead_magnet_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  company text,
  persona_segment text NOT NULL,
  offer_id text NOT NULL,
  offer_title text NOT NULL,
  pdf_path text NOT NULL,
  download_url text,
  purpose text,
  source text DEFAULT 'homepage',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  downloaded_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_magnet_downloads
CREATE POLICY "Admins can view all lead magnet downloads"
ON public.lead_magnet_downloads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Anyone can insert lead magnet downloads"
ON public.lead_magnet_downloads
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for lead magnets (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('lead-magnets', 'lead-magnets', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lead-magnets bucket
CREATE POLICY "Admins can manage lead magnets"
ON storage.objects FOR ALL
USING (bucket_id = 'lead-magnets' AND EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
));

CREATE POLICY "Anyone can read lead magnets with signed URL"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-magnets');

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lead_magnet_downloads_email ON public.lead_magnet_downloads(email);
CREATE INDEX IF NOT EXISTS idx_lead_magnet_downloads_persona ON public.lead_magnet_downloads(persona_segment);
CREATE INDEX IF NOT EXISTS idx_contacts_persona_segment ON public.contacts(persona_segment);