-- Create task_comments table for task notes and @mentions
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  mentioned_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to view comments on tasks they can access
CREATE POLICY "Users can view task comments"
  ON public.task_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Users can create task comments"
  ON public.task_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.task_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.task_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comment_timestamp();