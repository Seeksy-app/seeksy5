-- Fix search_path security warnings for media functions

-- Update move_media_to_folder function with search_path
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
    RETURN FALSE;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update soft_delete_media function with search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update restore_media function with search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the updated_at trigger function with search_path
CREATE OR REPLACE FUNCTION public.update_media_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
