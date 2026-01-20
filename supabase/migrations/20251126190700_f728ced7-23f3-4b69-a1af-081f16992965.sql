-- Add user_id column to existing rss_migrations table
ALTER TABLE public.rss_migrations 
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own migrations" ON public.rss_migrations;
DROP POLICY IF EXISTS "Users can create their own migrations" ON public.rss_migrations;
DROP POLICY IF EXISTS "Users can update their own migrations" ON public.rss_migrations;
DROP POLICY IF EXISTS "Users can delete their own migrations" ON public.rss_migrations;

CREATE POLICY "Users can view their own migrations"
  ON public.rss_migrations FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own migrations"
  ON public.rss_migrations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own migrations"
  ON public.rss_migrations FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own migrations"
  ON public.rss_migrations FOR DELETE
  USING (auth.uid()::text = user_id::text);