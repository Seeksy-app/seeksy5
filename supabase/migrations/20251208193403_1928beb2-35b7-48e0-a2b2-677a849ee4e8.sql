-- Add enhanced fields to tv_channels
ALTER TABLE public.tv_channels 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_tv_channels_owner ON public.tv_channels(owner_id);
CREATE INDEX IF NOT EXISTS idx_tv_channels_category ON public.tv_channels(category);