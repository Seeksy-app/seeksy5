-- Add selected_videos column to investor_links table
ALTER TABLE public.investor_links 
ADD COLUMN selected_videos text[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.investor_links.selected_videos IS 'Array of demo_video IDs to share. NULL means all videos.';