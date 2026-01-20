-- Create user_dashboard_layouts table for storing custom widget configurations
CREATE TABLE IF NOT EXISTS public.user_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_name TEXT NOT NULL DEFAULT 'default',
  widget_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, layout_name)
);

-- Enable RLS
ALTER TABLE public.user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_dashboard_layouts_user_id ON public.user_dashboard_layouts(user_id);
CREATE INDEX idx_user_dashboard_layouts_active ON public.user_dashboard_layouts(user_id, is_active) WHERE is_active = true;