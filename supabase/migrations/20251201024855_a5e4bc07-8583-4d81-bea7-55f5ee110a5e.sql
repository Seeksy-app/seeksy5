-- Fix podcast episodes RLS policy to check parent podcast publication status
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view published episodes" ON episodes;

-- Create a more restrictive policy that checks both episode and podcast publication
CREATE POLICY "Public can view published episodes from published podcasts"
  ON episodes
  FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM podcasts
      WHERE podcasts.id = episodes.podcast_id
      AND podcasts.is_published = true
    )
  );

-- Fix function search_path for security
-- Update the known functions that need search_path set
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.increment_campaign_stat(uuid, text) SET search_path = public;