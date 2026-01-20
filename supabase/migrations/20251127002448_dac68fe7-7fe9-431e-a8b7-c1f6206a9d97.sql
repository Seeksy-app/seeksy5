-- Create table for storing My Page layout customization
CREATE TABLE IF NOT EXISTS public.my_page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  element_type TEXT NOT NULL,
  position_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.my_page_layouts ENABLE ROW LEVEL SECURITY;

-- Policies for users to manage their own layouts
CREATE POLICY "Users can view their own layout"
  ON public.my_page_layouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layout"
  ON public.my_page_layouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layout"
  ON public.my_page_layouts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layout"
  ON public.my_page_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add unique constraint
ALTER TABLE public.my_page_layouts
ADD CONSTRAINT unique_user_element UNIQUE (user_id, element_type);

-- Create index for faster queries
CREATE INDEX idx_my_page_layouts_user_order ON public.my_page_layouts(user_id, position_order);

-- Trigger for updated_at
CREATE TRIGGER update_my_page_layouts_updated_at
  BEFORE UPDATE ON public.my_page_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();