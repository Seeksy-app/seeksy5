-- Create blog-assets storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('blog-assets', 'blog-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Blog assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-assets');

-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload blog assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-assets' AND auth.role() = 'authenticated');

-- Allow authenticated updates
CREATE POLICY "Authenticated users can update blog assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-assets' AND auth.role() = 'authenticated');

-- Allow service role to manage all
CREATE POLICY "Service role can manage blog assets"
ON storage.objects FOR ALL
USING (bucket_id = 'blog-assets');