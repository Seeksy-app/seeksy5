-- Add address field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create forms table for custom form builder
CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  form_name TEXT NOT NULL,
  form_slug TEXT UNIQUE NOT NULL,
  form_type TEXT NOT NULL DEFAULT 'lead_form',
  description TEXT,
  enabled_fields JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Create policies for forms
CREATE POLICY "Users can view their own forms"
  ON public.forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms"
  ON public.forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
  ON public.forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
  ON public.forms FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all forms
CREATE POLICY "Admins can view all forms"
  ON public.forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Create form_submissions table to track submissions
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.client_tickets(id) ON DELETE SET NULL,
  submitted_data JSONB NOT NULL,
  tracking_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on form_submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for form_submissions
CREATE POLICY "Form owners can view submissions"
  ON public.form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.forms
      WHERE forms.id = form_submissions.form_id
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions"
  ON public.form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Public can submit forms (handled via edge function)
CREATE POLICY "Anyone can submit forms"
  ON public.form_submissions FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger for forms
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();