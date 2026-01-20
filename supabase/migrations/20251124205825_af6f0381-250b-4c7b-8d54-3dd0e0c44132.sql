-- Create table to track investor portal shares
CREATE TABLE IF NOT EXISTS public.investor_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_email TEXT NOT NULL,
  investor_name TEXT,
  access_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.investor_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own investor shares"
  ON public.investor_shares
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own shares
CREATE POLICY "Users can create investor shares"
  ON public.investor_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all shares
CREATE POLICY "Admins can view all investor shares"
  ON public.investor_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update shares (for revocation)
CREATE POLICY "Admins can update investor shares"
  ON public.investor_shares
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_investor_shares_access_code ON public.investor_shares(access_code);
CREATE INDEX idx_investor_shares_user_id ON public.investor_shares(user_id);
CREATE INDEX idx_investor_shares_status ON public.investor_shares(status);