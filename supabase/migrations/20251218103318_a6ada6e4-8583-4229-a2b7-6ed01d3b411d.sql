-- Create storage bucket for WorkReady360 documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('workready360-docs', 'workready360-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload WorkReady360 docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workready360-docs');

-- Allow authenticated users to read their own uploads
CREATE POLICY "Users can read WorkReady360 docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'workready360-docs');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete WorkReady360 docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'workready360-docs');