-- Create storage buckets for media uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('event-images', 'event-images', true),
  ('studio-recordings', 'studio-recordings', true),
  ('podcast-covers', 'podcast-covers', true),
  ('episode-files', 'episode-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for event-images bucket
CREATE POLICY "Users can upload their own event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Event images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policies for studio-recordings bucket
CREATE POLICY "Users can upload their own studio recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'studio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Studio recordings are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'studio-recordings');

CREATE POLICY "Users can update their own studio recordings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'studio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own studio recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'studio-recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policies for podcast-covers bucket
CREATE POLICY "Users can upload their own podcast covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'podcast-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Podcast covers are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'podcast-covers');

CREATE POLICY "Users can update their own podcast covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'podcast-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own podcast covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'podcast-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policies for episode-files bucket
CREATE POLICY "Users can upload their own episode files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'episode-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Episode files are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'episode-files');

CREATE POLICY "Users can update their own episode files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'episode-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own episode files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'episode-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);