-- Add last_synced_at to rd_feeds for tracking sync status
ALTER TABLE public.rd_feeds ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add source_name to rd_feed_items for better display
ALTER TABLE public.rd_feed_items ADD COLUMN IF NOT EXISTS source_name TEXT;

-- Add cleaned_text to rd_feed_items for processed content
ALTER TABLE public.rd_feed_items ADD COLUMN IF NOT EXISTS cleaned_text TEXT;

-- Create kb_chunks table for semantic search embeddings
CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_item_id UUID REFERENCES public.rd_feed_items(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  token_count INTEGER,
  embedding_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for kb_chunks
CREATE INDEX IF NOT EXISTS idx_kb_chunks_source_item ON public.kb_chunks(source_item_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_created ON public.kb_chunks(created_at DESC);

-- Enable RLS on kb_chunks
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policies for kb_chunks - admin access
CREATE POLICY "Admins can manage kb_chunks" ON public.kb_chunks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Add tags array to rd_insights if not exists
ALTER TABLE public.rd_insights ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add confidence_score to rd_insights
ALTER TABLE public.rd_insights ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) DEFAULT 0.80;