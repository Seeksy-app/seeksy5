-- Create storage bucket for media vault uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-vault',
  'media-vault',
  true,
  524288000, -- 500MB limit
  ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/x-m4a',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
);

-- RLS Policies for media-vault bucket
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-vault' AND
  auth.uid()::text = (storage.foldername(name))[1]
);