-- Create storage buckets for Seeksy TV ads
INSERT INTO storage.buckets (id, name, public) VALUES ('seeksy-tv-ads', 'seeksy-tv-ads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('seeksy-tv-ad-thumbs', 'seeksy-tv-ad-thumbs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for seeksy-tv-ads bucket
CREATE POLICY "Admins can upload ads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seeksy-tv-ads' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Admins can update ads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seeksy-tv-ads' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Admins can delete ads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'seeksy-tv-ads' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Public can read ads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seeksy-tv-ads');

-- RLS policies for seeksy-tv-ad-thumbs bucket
CREATE POLICY "Admins can upload ad thumbs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seeksy-tv-ad-thumbs' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Admins can update ad thumbs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seeksy-tv-ad-thumbs' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Admins can delete ad thumbs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'seeksy-tv-ad-thumbs' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'ad_manager')
  )
);

CREATE POLICY "Public can read ad thumbs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seeksy-tv-ad-thumbs');