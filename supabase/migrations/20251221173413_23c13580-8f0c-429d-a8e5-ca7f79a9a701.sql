-- Create storage bucket for veteran profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('veteran-photos', 'veteran-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'veteran-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'veteran-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to profile photos
CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'veteran-photos');