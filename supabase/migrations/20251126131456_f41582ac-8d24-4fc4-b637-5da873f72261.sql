-- Create storage bucket for contact photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-photos', 'contact-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for contact photo uploads
CREATE POLICY "Users can upload contact photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contact-photos' AND
  auth.uid() IS NOT NULL
);

-- Allow public read access to contact photos
CREATE POLICY "Contact photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'contact-photos');