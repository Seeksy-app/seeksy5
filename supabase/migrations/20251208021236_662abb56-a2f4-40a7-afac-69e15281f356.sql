-- Create table for Pro Forma share links
CREATE TABLE public.proforma_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(20) NOT NULL UNIQUE,
  passcode VARCHAR(10) NOT NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  proforma_type VARCHAR(50) NOT NULL DEFAULT 'events-awards',
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  views INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proforma_share_links ENABLE ROW LEVEL SECURITY;

-- Policy for creators to manage their own links
CREATE POLICY "Users can create their own share links"
ON public.proforma_share_links
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own share links"
ON public.proforma_share_links
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own share links"
ON public.proforma_share_links
FOR UPDATE
USING (auth.uid() = created_by);

-- Policy for public access with valid token (for viewing)
CREATE POLICY "Anyone can view active links by token"
ON public.proforma_share_links
FOR SELECT
USING (status = 'active');

-- Create index for token lookups
CREATE INDEX idx_proforma_share_links_token ON public.proforma_share_links(token);
CREATE INDEX idx_proforma_share_links_created_by ON public.proforma_share_links(created_by);