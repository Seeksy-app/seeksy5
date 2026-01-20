-- Create tables for saved email templates and folders

CREATE TABLE IF NOT EXISTS public.email_template_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.email_template_folders(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  customized_html TEXT NOT NULL,
  customization_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_template_folders_user_id ON public.email_template_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_email_templates_user_id ON public.saved_email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_email_templates_folder_id ON public.saved_email_templates(folder_id);

-- Enable RLS
ALTER TABLE public.email_template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_template_folders
CREATE POLICY "Users can view their own folders"
  ON public.email_template_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON public.email_template_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.email_template_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.email_template_folders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for saved_email_templates
CREATE POLICY "Users can view their own saved templates"
  ON public.saved_email_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved templates"
  ON public.saved_email_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved templates"
  ON public.saved_email_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved templates"
  ON public.saved_email_templates FOR DELETE
  USING (auth.uid() = user_id);