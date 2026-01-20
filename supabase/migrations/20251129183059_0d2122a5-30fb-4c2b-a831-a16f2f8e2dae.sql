-- Create clip_collections table for organizing clips
CREATE TABLE IF NOT EXISTS public.clip_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for clip_collections
ALTER TABLE public.clip_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
  ON public.clip_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON public.clip_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.clip_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.clip_collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to collections"
  ON public.clip_collections FOR ALL
  USING (auth.role() = 'service_role');

-- Add collection_id and template_name to clips table
ALTER TABLE public.clips
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.clip_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Create index for faster collection lookups
CREATE INDEX IF NOT EXISTS idx_clips_collection_id ON public.clips(collection_id);

-- Add trigger for updated_at on clip_collections
CREATE OR REPLACE FUNCTION update_clip_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clip_collections_updated_at
  BEFORE UPDATE ON public.clip_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_clip_collections_updated_at();