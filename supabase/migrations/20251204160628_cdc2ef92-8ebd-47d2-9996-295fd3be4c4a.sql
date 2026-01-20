-- Create user_modules table for persistent module activation
CREATE TABLE IF NOT EXISTS public.user_modules (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activated modules"
  ON public.user_modules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can activate modules for themselves"
  ON public.user_modules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can deactivate their own modules"
  ON public.user_modules FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_modules_user_id ON public.user_modules(user_id);
CREATE INDEX idx_user_modules_module_id ON public.user_modules(module_id);