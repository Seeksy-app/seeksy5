-- Add section column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS section text DEFAULT NULL;

-- Create task_sections table for custom sections
CREATE TABLE IF NOT EXISTS public.task_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#EF4444',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_sections
CREATE POLICY "Users can view their own sections" ON public.task_sections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sections" ON public.task_sections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sections" ON public.task_sections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sections" ON public.task_sections
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default sections
-- Note: These will be created per-user when they first load the page