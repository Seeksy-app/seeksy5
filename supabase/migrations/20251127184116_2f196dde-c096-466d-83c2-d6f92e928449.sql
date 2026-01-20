-- Create storage bucket for UI screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('ui-screenshots', 'ui-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for ui-screenshots bucket
CREATE POLICY "Admin users can upload UI screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ui-screenshots' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Anyone can view UI screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ui-screenshots');