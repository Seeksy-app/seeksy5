-- Fix storage bucket policies for audio-ads-generated
-- Allow authenticated users to upload their voice recordings

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload voice recordings" ON storage.objects;

-- Create policy to allow authenticated users to upload to audio-ads-generated bucket
CREATE POLICY "Allow authenticated users to upload voice recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-ads-generated' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to read their own uploads
CREATE POLICY "Allow users to read their own voice recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-ads-generated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to update their own uploads
CREATE POLICY "Allow users to update their own voice recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-ads-generated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own voice recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-ads-generated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);