-- Legal Templates enhancements for document library
ALTER TABLE public.legal_templates 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general' CHECK (category IN ('general', 'creator', 'advertiser', 'investor', 'board', 'nda', 'platform')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS placeholders JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS target_roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_legal_templates_slug ON public.legal_templates(slug);
CREATE INDEX IF NOT EXISTS idx_legal_templates_category ON public.legal_templates(category);

-- Legal Acceptances table (click-wrap audit log)
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.legal_templates(id) ON DELETE RESTRICT,
  document_type TEXT NOT NULL,
  version_accepted TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on legal_acceptances
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can read their own acceptances
CREATE POLICY "Users can view own acceptances" ON public.legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- System inserts acceptances (via edge function)
CREATE POLICY "Service role can insert acceptances" ON public.legal_acceptances
  FOR INSERT WITH CHECK (true);

-- Admins can read all acceptances
CREATE POLICY "Admins can view all acceptances" ON public.legal_acceptances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Indexes for legal_acceptances
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON public.legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_type ON public.legal_acceptances(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_date ON public.legal_acceptances(accepted_at);

-- Update legal_doc_instances to support more document types
ALTER TABLE public.legal_doc_instances
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'stock_purchase',
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Seed initial templates for the library
INSERT INTO public.legal_templates (name, slug, category, description, body_text, requires_signature, placeholders, target_roles, is_active)
VALUES 
  ('Platform Terms of Service', 'platform-terms', 'platform', 'Terms and conditions for using the Seeksy platform', 
   E'SEEKSY PLATFORM TERMS OF SERVICE\n\nLast Updated: [EFFECTIVE_DATE]\n\nThese Terms of Service ("Terms") govern your access to and use of the Seeksy platform...',
   false, '[{"key": "EFFECTIVE_DATE", "label": "Effective Date", "type": "date"}]', '{}', true),
  
  ('Privacy Policy', 'privacy-policy', 'platform', 'Privacy policy and data handling practices',
   E'SEEKSY PRIVACY POLICY\n\nLast Updated: [EFFECTIVE_DATE]\n\nThis Privacy Policy describes how Seeksy collects, uses, and protects your information...',
   false, '[{"key": "EFFECTIVE_DATE", "label": "Effective Date", "type": "date"}]', '{}', true),

  ('Creator Agreement', 'creator-agreement', 'creator', 'Terms for creators using monetization features',
   E'SEEKSY CREATOR AGREEMENT\n\nThis Creator Agreement ("Agreement") is entered into between [CREATOR_NAME] ("Creator") and Parade Deck Holdings, Inc. dba Seeksy ("Seeksy").\n\n1. SERVICES\nCreator agrees to use Seeksy''s platform for content creation, distribution, and monetization...',
   true, '[{"key": "CREATOR_NAME", "label": "Creator Name", "type": "text"}, {"key": "CREATOR_EMAIL", "label": "Creator Email", "type": "email"}]', 
   ARRAY['creator'], true),

  ('Advertiser Agreement', 'advertiser-agreement', 'advertiser', 'Terms for advertisers running campaigns',
   E'SEEKSY ADVERTISER AGREEMENT\n\nThis Advertiser Agreement ("Agreement") is entered into between [COMPANY_NAME] ("Advertiser") and Parade Deck Holdings, Inc. dba Seeksy ("Seeksy").\n\n1. ADVERTISING SERVICES\nSeeksy agrees to provide advertising placement services on its platform...',
   true, '[{"key": "COMPANY_NAME", "label": "Company Name", "type": "text"}, {"key": "CONTACT_NAME", "label": "Contact Name", "type": "text"}, {"key": "CONTACT_EMAIL", "label": "Contact Email", "type": "email"}]',
   ARRAY['advertiser'], true),

  ('Board Member NDA', 'board-nda', 'nda', 'Non-disclosure agreement for board members',
   E'NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] by and between:\n\nParade Deck Holdings, Inc. dba Seeksy ("Disclosing Party")\nand\n[RECIPIENT_NAME] ("Receiving Party")\n\n1. CONFIDENTIAL INFORMATION\nThe Receiving Party agrees to hold in confidence all proprietary and confidential information...',
   true, '[{"key": "EFFECTIVE_DATE", "label": "Effective Date", "type": "date"}, {"key": "RECIPIENT_NAME", "label": "Recipient Name", "type": "text"}, {"key": "RECIPIENT_EMAIL", "label": "Recipient Email", "type": "email"}]',
   ARRAY['board_member', 'investor'], true),

  ('Investor NDA', 'investor-nda', 'nda', 'Non-disclosure agreement for potential investors',
   E'INVESTOR NON-DISCLOSURE AGREEMENT\n\nThis Non-Disclosure Agreement ("Agreement") is entered into as of [EFFECTIVE_DATE] by and between:\n\nParade Deck Holdings, Inc. dba Seeksy ("Company")\nand\n[INVESTOR_NAME] representing [INVESTOR_COMPANY] ("Potential Investor")\n\n1. PURPOSE\nThe Company is considering providing Potential Investor with certain confidential information for the purpose of evaluating a potential investment...',
   true, '[{"key": "EFFECTIVE_DATE", "label": "Effective Date", "type": "date"}, {"key": "INVESTOR_NAME", "label": "Investor Name", "type": "text"}, {"key": "INVESTOR_COMPANY", "label": "Investment Firm", "type": "text"}, {"key": "INVESTOR_EMAIL", "label": "Investor Email", "type": "email"}]',
   ARRAY['investor'], true)

ON CONFLICT (slug) DO NOTHING;