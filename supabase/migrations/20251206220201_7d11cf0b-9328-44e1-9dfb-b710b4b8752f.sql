-- Add missing style columns to email_signatures
ALTER TABLE public.email_signatures 
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS profile_image_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS profile_image_shape text DEFAULT 'circle',
ADD COLUMN IF NOT EXISTS social_icon_size text DEFAULT 'medium';