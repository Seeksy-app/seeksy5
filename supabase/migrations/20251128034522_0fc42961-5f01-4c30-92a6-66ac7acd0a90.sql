-- Add My Page v2 theme storage column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS my_page_v2_theme jsonb DEFAULT NULL;

COMMENT ON COLUMN public.profiles.my_page_v2_theme IS 'Stores My Page v2 theme configuration including colors, fonts, layout, and section settings';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_my_page_v2_theme ON public.profiles USING gin(my_page_v2_theme);