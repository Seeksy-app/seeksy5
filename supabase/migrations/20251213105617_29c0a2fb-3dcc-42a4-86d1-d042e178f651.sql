-- Create admin_notes table
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_admin_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_notes_updated_at();

-- Create indexes
CREATE INDEX idx_admin_notes_created_by ON public.admin_notes(created_by);
CREATE INDEX idx_admin_notes_is_pinned ON public.admin_notes(is_pinned DESC);
CREATE INDEX idx_admin_notes_updated_at ON public.admin_notes(updated_at DESC);
CREATE INDEX idx_admin_notes_is_archived ON public.admin_notes(is_archived);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admin/super_admin can access
CREATE POLICY "Admins can view their own notes"
ON public.admin_notes FOR SELECT
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can insert notes"
ON public.admin_notes FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update their own notes"
ON public.admin_notes FOR UPDATE
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can delete their own notes"
ON public.admin_notes FOR DELETE
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);