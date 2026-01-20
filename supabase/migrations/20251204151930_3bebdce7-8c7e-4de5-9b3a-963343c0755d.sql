-- Board Members table
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bio TEXT,
  photo_url TEXT,
  company TEXT,
  linkedin_url TEXT,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Board Notes table (private notes about board members)
CREATE TABLE IF NOT EXISTS public.board_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_member_id UUID NOT NULL REFERENCES public.board_members(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_members
DROP POLICY IF EXISTS "Board members visible to authenticated users" ON public.board_members;
DROP POLICY IF EXISTS "Admins can manage board members" ON public.board_members;
CREATE POLICY "Board members visible to authenticated users" ON public.board_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage board members" ON public.board_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'board_member'))
);

-- RLS Policies for board_notes
DROP POLICY IF EXISTS "Users can view their own board notes" ON public.board_notes;
DROP POLICY IF EXISTS "Users can create board notes" ON public.board_notes;
DROP POLICY IF EXISTS "Users can update their own board notes" ON public.board_notes;
DROP POLICY IF EXISTS "Users can delete their own board notes" ON public.board_notes;
CREATE POLICY "Users can view their own board notes" ON public.board_notes FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create board notes" ON public.board_notes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own board notes" ON public.board_notes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own board notes" ON public.board_notes FOR DELETE USING (auth.uid() = created_by);

-- Seed demo board members
INSERT INTO public.board_members (full_name, role, email, bio, company) VALUES
  ('Sarah Chen', 'Chair', 'sarah@seeksy.com', 'Experienced tech executive with 20+ years in SaaS', 'Seeksy'),
  ('Michael Torres', 'Board Member', 'michael@investor.com', 'Partner at leading venture capital firm', 'Growth Ventures'),
  ('Emily Watson', 'Board Member', 'emily@advisory.com', 'Former COO of multiple successful startups', 'Watson Advisory'),
  ('David Kim', 'Board Observer', 'david@seeksy.com', 'Co-founder and CTO', 'Seeksy')
ON CONFLICT DO NOTHING;