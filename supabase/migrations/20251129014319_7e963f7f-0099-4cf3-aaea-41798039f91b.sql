-- Create creator_faces table for face registration
CREATE TABLE IF NOT EXISTS public.creator_faces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_faces ENABLE ROW LEVEL SECURITY;

-- Creators can view their own face registrations
CREATE POLICY "Creators can view own faces"
  ON public.creator_faces
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can insert their own face registrations
CREATE POLICY "Creators can insert own faces"
  ON public.creator_faces
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own face registrations
CREATE POLICY "Creators can update own faces"
  ON public.creator_faces
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Creators can delete their own face registrations
CREATE POLICY "Creators can delete own faces"
  ON public.creator_faces
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Admins can view all face registrations
CREATE POLICY "Admins can view all faces"
  ON public.creator_faces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_creator_faces_creator_id ON public.creator_faces(creator_id);

-- Add updated_at trigger
CREATE TRIGGER update_creator_faces_updated_at
  BEFORE UPDATE ON public.creator_faces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();