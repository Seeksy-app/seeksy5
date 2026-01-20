-- Create board_settings table for CFO → Board synced content
CREATE TABLE IF NOT EXISTS public.board_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb,
  last_updated_by uuid REFERENCES auth.users(id),
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage board settings"
ON public.board_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'cfo', 'cmo')
  )
);

CREATE POLICY "Board members can read board settings"
ON public.board_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('board_member', 'read_only_analyst', 'admin', 'super_admin', 'cfo', 'cmo')
  )
);

-- Insert default SWOT setting
INSERT INTO public.board_settings (setting_key, setting_value)
VALUES ('cfo_swot', '{"strengths": [], "weaknesses": [], "opportunities": [], "threats": [], "ai_summary": null}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create board_shared_reports table for pro forma sharing
CREATE TABLE IF NOT EXISTS public.board_shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL, -- 'custom_proforma', 'ai_proforma', etc.
  report_name text NOT NULL,
  report_data jsonb,
  shared_by uuid REFERENCES auth.users(id),
  shared_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text
);

ALTER TABLE public.board_shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shared reports"
ON public.board_shared_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin', 'cfo', 'cmo')
  )
);

CREATE POLICY "Board members can read shared reports"
ON public.board_shared_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('board_member', 'read_only_analyst', 'admin', 'super_admin', 'cfo', 'cmo')
  )
);