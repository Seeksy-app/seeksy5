-- Create storage bucket for signature profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-profiles', 'signature-profiles', true);

-- Allow public read access
CREATE POLICY "Anyone can view signature profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'signature-profiles');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload signature profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signature-profiles' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "Users can update signature profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signature-profiles' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete signature profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'signature-profiles' AND auth.role() = 'authenticated');