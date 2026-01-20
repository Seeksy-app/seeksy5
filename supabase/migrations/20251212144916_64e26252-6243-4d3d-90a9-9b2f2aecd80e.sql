-- Fix RLS policy that incorrectly queries auth.users directly
-- Drop the problematic policy
DROP POLICY IF EXISTS "Purchasers can manage their own draft instances" ON public.legal_doc_instances;

-- Create a security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Recreate the policy using the secure function
CREATE POLICY "Purchasers can manage their own instances"
ON public.legal_doc_instances
FOR ALL
USING (
  (purchaser_user_id = auth.uid())
  OR (purchaser_email = public.get_current_user_email())
);

-- Add created_by column to track who created the instance (admin)
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add invite_token for purchaser email links
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;

-- Add invite_sent_at timestamp
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz;

-- Add signature fields
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS seller_signature_url text;

ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS seller_signed_at timestamptz;

ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS purchaser_signature_url text;

ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS purchaser_signed_at timestamptz;

-- Add final PDF URL
ALTER TABLE public.legal_doc_instances 
ADD COLUMN IF NOT EXISTS final_pdf_url text;

-- Update admin policy to also allow insert
DROP POLICY IF EXISTS "Admins can manage all instances" ON public.legal_doc_instances;

CREATE POLICY "Admins can manage all instances"
ON public.legal_doc_instances
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));