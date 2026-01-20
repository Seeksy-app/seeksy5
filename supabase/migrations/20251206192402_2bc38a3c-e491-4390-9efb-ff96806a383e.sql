-- Create storage bucket for signature banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signature-banners', 'signature-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload banners
CREATE POLICY "Users can upload signature banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signature-banners');

-- Allow public read access for banners (needed for email clients)
CREATE POLICY "Public read access for signature banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'signature-banners');

-- Allow users to update their own banners
CREATE POLICY "Users can update own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'signature-banners');

-- Allow users to delete their own banners
CREATE POLICY "Users can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signature-banners');