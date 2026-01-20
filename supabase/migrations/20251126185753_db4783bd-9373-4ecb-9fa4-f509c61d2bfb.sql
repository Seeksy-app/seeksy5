-- Add photos column to episodes table
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Add episode_artwork_url column if not exists (for backward compatibility)
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS episode_artwork_url TEXT;

-- Add episode_type column if not exists (for backward compatibility)
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS episode_type TEXT DEFAULT 'full';

-- Add is_explicit column if not exists (for backward compatibility)
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT false;