-- TV Content table for imported videos
CREATE TABLE public.tv_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT DEFAULT 'general',
  tags TEXT[],
  series_name TEXT,
  episode_number INTEGER,
  season_number INTEGER,
  source TEXT DEFAULT 'upload',
  source_id TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tv_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own TV content"
  ON public.tv_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own TV content"
  ON public.tv_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TV content"
  ON public.tv_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TV content"
  ON public.tv_content FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published TV content"
  ON public.tv_content FOR SELECT
  USING (is_published = true);

-- Index for performance
CREATE INDEX idx_tv_content_user_id ON public.tv_content(user_id);
CREATE INDEX idx_tv_content_series ON public.tv_content(series_name);
CREATE INDEX idx_tv_content_published ON public.tv_content(is_published) WHERE is_published = true;

-- Trigger for updated_at
CREATE TRIGGER update_tv_content_updated_at
  BEFORE UPDATE ON public.tv_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Dropbox import jobs table
CREATE TABLE public.dropbox_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  total_files INTEGER DEFAULT 0,
  processed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  folder_path TEXT,
  series_name TEXT,
  error_message TEXT,
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.dropbox_import_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own import jobs"
  ON public.dropbox_import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import jobs"
  ON public.dropbox_import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import jobs"
  ON public.dropbox_import_jobs FOR UPDATE
  USING (auth.uid() = user_id);