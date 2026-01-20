-- Add source_url column to knowledge_articles if not exists
ALTER TABLE public.knowledge_articles ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create table for scheduled article generation jobs
CREATE TABLE IF NOT EXISTS public.blog_generation_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  portal TEXT NOT NULL DEFAULT 'creator',
  article_count INTEGER NOT NULL DEFAULT 3,
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  email_to_creators BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_generation_schedules ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage schedules" ON public.blog_generation_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Trigger for updated_at
CREATE TRIGGER update_blog_generation_schedules_updated_at
  BEFORE UPDATE ON public.blog_generation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();