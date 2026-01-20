-- Add storage policies for media-vault bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload to media-vault" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media-vault' 
  AND auth.role() = 'authenticated'
);

-- Users can view public media-vault content
CREATE POLICY "Users can view media-vault content" ON storage.objects
FOR SELECT USING (bucket_id = 'media-vault');

-- Users can update their own uploads (check first folder is user_id)
CREATE POLICY "Users can update their media-vault files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media-vault' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete their media-vault files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media-vault' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add policies for studio-recordings bucket (same pattern)
CREATE POLICY "Users can upload to studio-recordings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'studio-recordings' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their studio-recordings files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'studio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their studio-recordings files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'studio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);