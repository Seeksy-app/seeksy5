-- Add missing columns to custom_packages table
ALTER TABLE public.custom_packages 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for faster default lookup
CREATE INDEX IF NOT EXISTS idx_custom_packages_user_default 
ON public.custom_packages(user_id, is_default) WHERE is_default = true;

-- Function to ensure only one default workspace per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.custom_packages 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to enforce single default
DROP TRIGGER IF EXISTS enforce_single_default_workspace ON public.custom_packages;
CREATE TRIGGER enforce_single_default_workspace
  BEFORE INSERT OR UPDATE ON public.custom_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_workspace();