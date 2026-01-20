-- Update media-vault bucket to allow WebM files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'video/mp4', 
  'video/quicktime', 
  'video/x-msvideo', 
  'video/x-matroska',
  'video/webm',
  'audio/mpeg', 
  'audio/wav', 
  'audio/mp4', 
  'audio/x-m4a',
  'audio/webm',
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'image/gif'
]
WHERE id = 'media-vault';