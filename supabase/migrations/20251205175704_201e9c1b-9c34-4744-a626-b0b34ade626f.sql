-- ================================================
-- AI Clip Generation MVP - Database Schema Updates
-- ================================================

-- Add missing columns to media_files table for clip tracking
ALTER TABLE public.media_files 
ADD COLUMN IF NOT EXISTS parent_media_id UUID REFERENCES public.media_files(id),
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video';

-- Create index for parent_media_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_media_files_parent_media_id ON public.media_files(parent_media_id);
CREATE INDEX IF NOT EXISTS idx_media_files_media_type ON public.media_files(media_type);

-- Create clip_jobs table for tracking AI clip generation jobs
CREATE TABLE IF NOT EXISTS public.clip_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_media_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  options JSONB DEFAULT '{}',
  total_clips INTEGER DEFAULT 0,
  error_message TEXT,
  progress_percent INTEGER DEFAULT 0,
  current_step TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for clip_jobs
CREATE INDEX IF NOT EXISTS idx_clip_jobs_user_id ON public.clip_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_source_media_id ON public.clip_jobs(source_media_id);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_status ON public.clip_jobs(status);

-- Enable RLS on clip_jobs
ALTER TABLE public.clip_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for clip_jobs
CREATE POLICY "Users can view their own clip jobs"
  ON public.clip_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clip jobs"
  ON public.clip_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clip jobs"
  ON public.clip_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Add clip_job_id to clips table to link clips to their generation job
ALTER TABLE public.clips
ADD COLUMN IF NOT EXISTS clip_job_id UUID REFERENCES public.clip_jobs(id);

-- Add aspect_ratio and export_format to clips table
ALTER TABLE public.clips
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '9:16',
ADD COLUMN IF NOT EXISTS export_formats JSONB DEFAULT '["9:16"]',
ADD COLUMN IF NOT EXISTS hook_score INTEGER,
ADD COLUMN IF NOT EXISTS transcript_snippet TEXT,
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'seeksy_default';

-- Create index for clip_job_id
CREATE INDEX IF NOT EXISTS idx_clips_clip_job_id ON public.clips(clip_job_id);
CREATE INDEX IF NOT EXISTS idx_clips_aspect_ratio ON public.clips(aspect_ratio);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_clip_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on clip_jobs
DROP TRIGGER IF EXISTS update_clip_jobs_updated_at ON public.clip_jobs;
CREATE TRIGGER update_clip_jobs_updated_at
  BEFORE UPDATE ON public.clip_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clip_jobs_updated_at();