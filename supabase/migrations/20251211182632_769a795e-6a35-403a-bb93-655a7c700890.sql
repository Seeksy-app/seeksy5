-- Create table for veteran referral partner applications
CREATE TABLE public.veteran_referral_partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  org_type TEXT NOT NULL,
  services TEXT[] NOT NULL,
  regions TEXT[] NOT NULL,
  response_time TEXT NOT NULL,
  ideal_client TEXT NOT NULL,
  licensing TEXT NOT NULL,
  extra_notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veteran_referral_partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow public insert for applications
CREATE POLICY "Anyone can submit partner applications"
ON public.veteran_referral_partner_applications
FOR INSERT
WITH CHECK (true);

-- Allow admins to view and manage applications
CREATE POLICY "Admins can view all partner applications"
ON public.veteran_referral_partner_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'platform_owner', 'admin')
  )
);

CREATE POLICY "Admins can update partner applications"
ON public.veteran_referral_partner_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'platform_owner', 'admin')
  )
);

-- Create index for faster queries
CREATE INDEX idx_veteran_referral_partner_applications_status ON public.veteran_referral_partner_applications(status);
CREATE INDEX idx_veteran_referral_partner_applications_email ON public.veteran_referral_partner_applications(email);