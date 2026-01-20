-- Create team_invitations table to track sent invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations they sent
CREATE POLICY "Users can view invitations they sent"
  ON public.team_invitations
  FOR SELECT
  USING (auth.uid() = inviter_id);

-- Policy: Users can create invitations for their team
CREATE POLICY "Users can create team invitations"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Policy: Users can update invitations they sent
CREATE POLICY "Users can update their invitations"
  ON public.team_invitations
  FOR UPDATE
  USING (auth.uid() = inviter_id);

-- Policy: Users can delete invitations they sent
CREATE POLICY "Users can delete their invitations"
  ON public.team_invitations
  FOR DELETE
  USING (auth.uid() = inviter_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_team_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_team_invitations_updated_at();

-- Create index for faster queries
CREATE INDEX idx_team_invitations_inviter_id ON public.team_invitations(inviter_id);
CREATE INDEX idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(invitee_email);