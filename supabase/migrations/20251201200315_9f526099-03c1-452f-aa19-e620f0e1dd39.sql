-- Create vault_access_codes table for storing hashed access codes
CREATE TABLE IF NOT EXISTS public.vault_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create keys_vault table for managing API keys and secrets metadata
CREATE TABLE IF NOT EXISTS public.keys_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_description TEXT,
  is_configured BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMP WITH TIME ZONE,
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create keys_vault_audit table for tracking all vault access events
CREATE TABLE IF NOT EXISTS public.keys_vault_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  key_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vault_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keys_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keys_vault_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vault_access_codes
CREATE POLICY "Super admins can manage access codes"
  ON public.vault_access_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for keys_vault
CREATE POLICY "Super admins can view all keys"
  ON public.keys_vault
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super admins can update keys"
  ON public.keys_vault
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- RLS Policies for keys_vault_audit
CREATE POLICY "Super admins can view audit logs"
  ON public.keys_vault_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.keys_vault_audit
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vault_access_codes_user_id ON public.vault_access_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_keys_vault_key_name ON public.keys_vault(key_name);
CREATE INDEX IF NOT EXISTS idx_keys_vault_audit_user_id ON public.keys_vault_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_keys_vault_audit_created_at ON public.keys_vault_audit(created_at DESC);