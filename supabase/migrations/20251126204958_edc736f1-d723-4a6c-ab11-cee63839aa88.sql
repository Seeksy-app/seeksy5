-- Create public storage bucket for persona videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'persona-videos',
  'persona-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- Allow public read access to persona videos
CREATE POLICY "Public Access to Persona Videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'persona-videos');

-- Allow authenticated users to upload persona videos
CREATE POLICY "Authenticated users can upload persona videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'persona-videos');

-- Allow authenticated users to update their persona videos
CREATE POLICY "Authenticated users can update persona videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'persona-videos');

-- Allow authenticated users to delete persona videos
CREATE POLICY "Authenticated users can delete persona videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'persona-videos');