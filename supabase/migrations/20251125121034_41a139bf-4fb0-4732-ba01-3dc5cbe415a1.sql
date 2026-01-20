-- Create table for lead photos
CREATE TABLE IF NOT EXISTS public.lead_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add geolocation fields to tickets table
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS work_types TEXT[],
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT[],
ADD COLUMN IF NOT EXISTS best_contact_times TEXT[],
ADD COLUMN IF NOT EXISTS scheduled_estimate_time TEXT;

-- Enable RLS on lead_photos
ALTER TABLE public.lead_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_photos
CREATE POLICY "Users can view lead photos for their tickets"
  ON public.lead_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = lead_photos.ticket_id
      AND (
        t.user_id = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "Users can insert lead photos for their tickets"
  ON public.lead_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = lead_photos.ticket_id
      AND (
        t.user_id = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- Create storage bucket for lead photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-photos', 'lead-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lead photos
CREATE POLICY "Anyone can view lead photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lead-photos');

CREATE POLICY "Authenticated users can upload lead photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-photos'
    AND auth.role() = 'authenticated'
  );