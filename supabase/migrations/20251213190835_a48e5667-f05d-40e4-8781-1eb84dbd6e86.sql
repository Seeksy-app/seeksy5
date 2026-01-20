-- Create investor application settings table
CREATE TABLE public.investor_application_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_per_share DECIMAL(10, 4) NOT NULL DEFAULT 0.20,
  allowed_emails TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  confidentiality_notice TEXT DEFAULT 'All information provided is strictly confidential and will only be used for the purpose of processing your investment application. Your personal data will be protected in accordance with applicable privacy laws.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_application_settings ENABLE ROW LEVEL SECURITY;

-- Admin can read/update
CREATE POLICY "Admins can manage investor settings"
ON public.investor_application_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'cfo')
  )
);

-- Public can read (for gating check)
CREATE POLICY "Public can read investor settings for gating"
ON public.investor_application_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.investor_application_settings (price_per_share, allowed_emails, is_active)
VALUES (0.20, '{}', true);

-- Create trigger for updated_at
CREATE TRIGGER update_investor_settings_updated_at
BEFORE UPDATE ON public.investor_application_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();