-- User My Day Layout preferences table
CREATE TABLE public.user_myday_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID,
  layout_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.user_myday_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own layouts
CREATE POLICY "Users can view their own layouts"
  ON public.user_myday_layouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layouts"
  ON public.user_myday_layouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layouts"
  ON public.user_myday_layouts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layouts"
  ON public.user_myday_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_myday_layouts_updated_at
  BEFORE UPDATE ON public.user_myday_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();