-- Add investor_emails table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.investor_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES public.investor_links(id) ON DELETE CASCADE,
  investor_email TEXT NOT NULL,
  investor_name TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add index for link_id
CREATE INDEX idx_investor_emails_link_id ON public.investor_emails(link_id);

-- Enable RLS
ALTER TABLE public.investor_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all investor emails"
ON public.investor_emails FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'board_member')
  )
);

CREATE POLICY "Admins can insert investor emails"
ON public.investor_emails FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'board_member')
  )
);

-- Add columns to investor_link_activity for better tracking
ALTER TABLE public.investor_link_activity ADD COLUMN IF NOT EXISTS ip_region TEXT;
ALTER TABLE public.investor_link_activity ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.investor_link_activity ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.investor_link_activity ADD COLUMN IF NOT EXISTS time_on_page_seconds INTEGER;

-- Add mask_financials column to investor_links
ALTER TABLE public.investor_links ADD COLUMN IF NOT EXISTS mask_financials BOOLEAN DEFAULT false;
ALTER TABLE public.investor_links ADD COLUMN IF NOT EXISTS what_was_shared TEXT[];