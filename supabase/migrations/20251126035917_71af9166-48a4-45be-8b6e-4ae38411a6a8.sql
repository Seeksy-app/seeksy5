-- Create investor_spreadsheets table
CREATE TABLE IF NOT EXISTS public.investor_spreadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx')),
  period TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_spreadsheets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view spreadsheets
CREATE POLICY "Authenticated users can view spreadsheets"
  ON public.investor_spreadsheets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert spreadsheets
CREATE POLICY "Admins can insert spreadsheets"
  ON public.investor_spreadsheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can update spreadsheets
CREATE POLICY "Admins can update spreadsheets"
  ON public.investor_spreadsheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can delete spreadsheets
CREATE POLICY "Admins can delete spreadsheets"
  ON public.investor_spreadsheets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create storage bucket for investor spreadsheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('investor-spreadsheets', 'investor-spreadsheets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for investor spreadsheets
CREATE POLICY "Authenticated users can view investor spreadsheets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'investor-spreadsheets');

CREATE POLICY "Admins can upload investor spreadsheets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'investor-spreadsheets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete investor spreadsheets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'investor-spreadsheets'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );