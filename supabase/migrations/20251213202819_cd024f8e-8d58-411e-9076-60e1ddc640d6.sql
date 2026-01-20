-- Create storage bucket for legal document templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('legal-templates', 'legal-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload templates
CREATE POLICY "Admins can upload legal templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'legal-templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to read templates
CREATE POLICY "Admins can read legal templates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'legal-templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow service role (edge functions) to read templates
CREATE POLICY "Service role can read legal templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'legal-templates');

-- Allow admins to delete/update templates
CREATE POLICY "Admins can manage legal templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'legal-templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);