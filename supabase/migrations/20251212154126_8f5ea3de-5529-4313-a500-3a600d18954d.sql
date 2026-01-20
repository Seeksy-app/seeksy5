-- Allow public access to legal_doc_instances via invite_token for purchasers
CREATE POLICY "Public access via invite token"
ON public.legal_doc_instances
FOR SELECT
USING (invite_token IS NOT NULL);

-- Allow public updates via invite token (for purchasers to fill in their info)
CREATE POLICY "Public update via invite token"
ON public.legal_doc_instances
FOR UPDATE
USING (invite_token IS NOT NULL)
WITH CHECK (invite_token IS NOT NULL);