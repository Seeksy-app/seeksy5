-- Add storage policies for legal-templates bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload legal templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'legal-templates' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read legal templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'legal-templates');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update legal templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'legal-templates' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete legal templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'legal-templates' AND auth.role() = 'authenticated');