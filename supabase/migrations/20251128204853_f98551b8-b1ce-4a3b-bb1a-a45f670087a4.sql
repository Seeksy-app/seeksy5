-- Create storage bucket for ad creative assets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-assets', 'ad-assets', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for ad-assets bucket
CREATE POLICY "Admins can upload ad assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ad-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can view ad assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ad-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete ad assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ad-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Advertisers can view their ad assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ad-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM advertisers WHERE owner_profile_id = auth.uid()
  )
);