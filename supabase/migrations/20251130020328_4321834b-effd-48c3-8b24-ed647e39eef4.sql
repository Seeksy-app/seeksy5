-- Media Library Creator Vault Enhancement
-- Adds folders/collections support and soft delete for media organization

-- 1. Create media_folders table for organizing all media types
CREATE TABLE IF NOT EXISTS public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- Optional color code for folder visualization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for media_folders
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON public.media_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.media_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.media_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.media_folders FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all folders"
  ON public.media_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add index for performance
CREATE INDEX idx_media_folders_user_id ON public.media_folders(user_id);

-- 2. Add folder_id to media_files for organization
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL;

-- 3. Add deleted_at for soft delete on media_files
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 4. Add deleted_at for soft delete on clips
ALTER TABLE public.clips 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 5. Add cert_updated_at to clips if missing (for certification status tracking)
ALTER TABLE public.clips 
ADD COLUMN IF NOT EXISTS cert_updated_at TIMESTAMP WITH TIME ZONE;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_folder_id ON public.media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON public.media_files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clips_deleted_at ON public.clips(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clips_cert_status ON public.clips(cert_status);

-- 7. Add automatic updated_at trigger for media_folders
CREATE OR REPLACE FUNCTION public.update_media_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_folders_updated_at();

-- 8. Add function to move media to folder (with validation)
CREATE OR REPLACE FUNCTION public.move_media_to_folder(
  media_type TEXT,
  media_id UUID,
  target_folder_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF media_type = 'media_file' THEN
    UPDATE public.media_files
    SET folder_id = target_folder_id
    WHERE id = media_id AND user_id = current_user_id;
  ELSIF media_type = 'clip' THEN
    -- Note: clips don't have folder_id yet, but we're preparing for future
    -- For now, this returns FALSE for clips
    RETURN FALSE;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add function to soft delete media
CREATE OR REPLACE FUNCTION public.soft_delete_media(
  media_type TEXT,
  media_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF media_type = 'media_file' THEN
    UPDATE public.media_files
    SET deleted_at = NOW()
    WHERE id = media_id AND user_id = current_user_id AND deleted_at IS NULL;
  ELSIF media_type = 'clip' THEN
    UPDATE public.clips
    SET deleted_at = NOW()
    WHERE id = media_id AND user_id = current_user_id AND deleted_at IS NULL;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add function to restore soft-deleted media
CREATE OR REPLACE FUNCTION public.restore_media(
  media_type TEXT,
  media_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  SELECT auth.uid() INTO current_user_id;
  
  IF media_type = 'media_file' THEN
    UPDATE public.media_files
    SET deleted_at = NULL
    WHERE id = media_id AND user_id = current_user_id AND deleted_at IS NOT NULL;
  ELSIF media_type = 'clip' THEN
    UPDATE public.clips
    SET deleted_at = NULL
    WHERE id = media_id AND user_id = current_user_id AND deleted_at IS NOT NULL;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
