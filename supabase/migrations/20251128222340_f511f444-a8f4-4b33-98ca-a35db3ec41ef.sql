-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('studio_recording', 'podcast_episode', 'upload', 'meeting')),
  language TEXT DEFAULT 'en',
  raw_text TEXT NOT NULL,
  ai_model TEXT NOT NULL DEFAULT 'elevenlabs-stt-v1',
  word_timestamps JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('transcript', 'manual', 'import')) DEFAULT 'manual',
  transcript_id UUID REFERENCES public.transcripts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  cover_image_url TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique constraint on slug per user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_user_id_slug_key'
  ) THEN
    ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_user_id_slug_key UNIQUE(user_id, slug);
  END IF;
END $$;

-- Create content_credentials table
CREATE TABLE IF NOT EXISTS public.content_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('transcript', 'blog_post')),
  transcript_id UUID REFERENCES public.transcripts(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  chain TEXT DEFAULT 'polygon',
  tx_hash TEXT,
  token_id TEXT,
  metadata_uri TEXT,
  nft_metadata JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'minting', 'minted', 'failed')) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CHECK (
    (content_type = 'transcript' AND transcript_id IS NOT NULL AND blog_post_id IS NULL) OR
    (content_type = 'blog_post' AND blog_post_id IS NOT NULL AND transcript_id IS NULL)
  )
);

-- Create unique constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_credentials_transcript_id_key') THEN
    ALTER TABLE public.content_credentials ADD CONSTRAINT content_credentials_transcript_id_key UNIQUE(transcript_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_credentials_blog_post_id_key') THEN
    ALTER TABLE public.content_credentials ADD CONSTRAINT content_credentials_blog_post_id_key UNIQUE(blog_post_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Users can insert own transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Users can update own transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Users can delete own transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Admins can view all transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "Users can view own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can insert own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view own content credentials" ON public.content_credentials;
DROP POLICY IF EXISTS "Public can view minted content credentials" ON public.content_credentials;
DROP POLICY IF EXISTS "Users can insert own content credentials" ON public.content_credentials;
DROP POLICY IF EXISTS "Users can update own content credentials" ON public.content_credentials;
DROP POLICY IF EXISTS "Admins can view all content credentials" ON public.content_credentials;

-- RLS Policies for transcripts
CREATE POLICY "Users can view own transcripts"
  ON public.transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
  ON public.transcripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts"
  ON public.transcripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts"
  ON public.transcripts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transcripts"
  ON public.transcripts FOR SELECT
  USING (is_adm());

-- RLS Policies for blog_posts
CREATE POLICY "Users can view own blog posts"
  ON public.blog_posts FOR SELECT
  USING (auth.uid() = user_id OR status = 'published');

CREATE POLICY "Users can insert own blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog posts"
  ON public.blog_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blog posts"
  ON public.blog_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all blog posts"
  ON public.blog_posts FOR SELECT
  USING (is_adm());

-- RLS Policies for content_credentials
CREATE POLICY "Users can view own content credentials"
  ON public.content_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view minted content credentials"
  ON public.content_credentials FOR SELECT
  USING (status = 'minted');

CREATE POLICY "Users can insert own content credentials"
  ON public.content_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content credentials"
  ON public.content_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all content credentials"
  ON public.content_credentials FOR SELECT
  USING (is_adm());

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_transcripts_user ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_asset ON public.transcripts(asset_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_content_credentials_user ON public.content_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_content_credentials_transcript ON public.content_credentials(transcript_id);
CREATE INDEX IF NOT EXISTS idx_content_credentials_blog ON public.content_credentials(blog_post_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
DROP TRIGGER IF EXISTS update_transcripts_updated_at ON public.transcripts;
DROP TRIGGER IF EXISTS update_content_credentials_updated_at ON public.content_credentials;

-- Triggers for updated_at
CREATE TRIGGER update_transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_credentials_updated_at
  BEFORE UPDATE ON public.content_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();