-- Create trucking user invites table for pending invitations
CREATE TABLE IF NOT EXISTS public.trucking_user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  agency_id UUID REFERENCES public.trucking_agencies(id),
  role TEXT NOT NULL DEFAULT 'admin',
  invited_by UUID REFERENCES auth.users(id),
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.trucking_user_invites ENABLE ROW LEVEL SECURITY;

-- Policies for invites
CREATE POLICY "Admins can view invites" ON public.trucking_user_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trucking_admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create invites" ON public.trucking_user_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.trucking_admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update invites" ON public.trucking_user_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trucking_admin_users WHERE user_id = auth.uid())
  );

-- Index for token lookup
CREATE INDEX idx_trucking_user_invites_token ON public.trucking_user_invites(invite_token);
CREATE INDEX idx_trucking_user_invites_email ON public.trucking_user_invites(email);