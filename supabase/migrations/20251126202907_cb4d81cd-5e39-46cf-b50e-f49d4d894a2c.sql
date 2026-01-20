-- Create keys vault table to track API keys metadata
CREATE TABLE IF NOT EXISTS public.keys_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_description TEXT,
  is_configured BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMPTZ,
  last_updated_by UUID REFERENCES auth.users(id),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vault access codes table for security
CREATE TABLE IF NOT EXISTS public.vault_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit log for key vault access
CREATE TABLE IF NOT EXISTS public.keys_vault_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  key_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.keys_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keys_vault_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for keys_vault (super_admin only)
CREATE POLICY "Super admins can view keys vault"
  ON public.keys_vault FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update keys vault"
  ON public.keys_vault FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert keys vault"
  ON public.keys_vault FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for vault_access_codes (super_admin only, own record)
CREATE POLICY "Super admins can view own access code"
  ON public.vault_access_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') AND user_id = auth.uid());

CREATE POLICY "Super admins can update own access code"
  ON public.vault_access_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') AND user_id = auth.uid());

CREATE POLICY "Super admins can insert own access code"
  ON public.vault_access_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') AND user_id = auth.uid());

-- RLS Policies for audit log
CREATE POLICY "Super admins can view audit log"
  ON public.keys_vault_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert audit log"
  ON public.keys_vault_audit FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert default keys to track
INSERT INTO public.keys_vault (key_name, key_description, is_required) VALUES
  ('ELEVENLABS_API_KEY', 'ElevenLabs API for voice generation, music, and conversational AI', true),
  ('OPENAI_API_KEY', 'OpenAI API for GPT models', false),
  ('STRIPE_SECRET_KEY', 'Stripe payment processing', false),
  ('TWILIO_ACCOUNT_SID', 'Twilio SMS and phone services', false),
  ('TWILIO_AUTH_TOKEN', 'Twilio authentication token', false),
  ('GOOGLE_OAUTH_CLIENT_ID', 'Google OAuth authentication', false),
  ('GOOGLE_OAUTH_CLIENT_SECRET', 'Google OAuth secret', false)
ON CONFLICT (key_name) DO NOTHING;