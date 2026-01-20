-- Create table for tracking upload failures
CREATE TABLE IF NOT EXISTS public.upload_failure_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  error_message TEXT NOT NULL,
  error_type TEXT NOT NULL,
  upload_progress INTEGER,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.upload_failure_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own failure logs
CREATE POLICY "Users can insert their own upload failure logs"
  ON public.upload_failure_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all failure logs
CREATE POLICY "Admins can view all upload failure logs"
  ON public.upload_failure_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_upload_failure_logs_user_id ON public.upload_failure_logs(user_id);
CREATE INDEX idx_upload_failure_logs_created_at ON public.upload_failure_logs(created_at DESC);