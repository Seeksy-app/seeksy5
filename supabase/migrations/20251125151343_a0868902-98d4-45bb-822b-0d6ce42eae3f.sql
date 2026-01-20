-- Create table for storing post-production video edits
CREATE TABLE IF NOT EXISTS public.video_post_production_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_file_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  markers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_post_production_edits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own edits"
  ON public.video_post_production_edits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own edits"
  ON public.video_post_production_edits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own edits"
  ON public.video_post_production_edits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own edits"
  ON public.video_post_production_edits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_post_production_edits_updated_at
  BEFORE UPDATE ON public.video_post_production_edits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_video_post_production_edits_media_file_id 
  ON public.video_post_production_edits(media_file_id);

CREATE INDEX idx_video_post_production_edits_user_id 
  ON public.video_post_production_edits(user_id);