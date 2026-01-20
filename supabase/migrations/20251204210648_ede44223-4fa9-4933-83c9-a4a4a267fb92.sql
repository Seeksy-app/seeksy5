-- Update media-vault bucket to allow PDF uploads
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/mp4',
  'application/pdf'
]
WHERE id = 'media-vault';

-- If bucket doesn't exist or has no restrictions, ensure it allows PDFs
-- Also update if allowed_mime_types was null (meaning all types were allowed, but explicit list is safer)
UPDATE storage.buckets 
SET allowed_mime_types = NULL
WHERE id = 'media-vault';