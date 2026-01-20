-- Create storage bucket for legal documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for legal-documents bucket
CREATE POLICY "Public can read legal documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'legal-documents');

CREATE POLICY "Authenticated users can upload legal documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Service role can manage legal documents"
ON storage.objects FOR ALL
USING (bucket_id = 'legal-documents');