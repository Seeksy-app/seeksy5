-- Create voice_verification_attempts table to track validation attempts
CREATE TABLE IF NOT EXISTS public.voice_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL DEFAULT false,
  error_code TEXT,
  recording_duration INTEGER,
  selected_prompt TEXT,
  match_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own verification attempts"
  ON public.voice_verification_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert attempts
CREATE POLICY "System can insert verification attempts"
  ON public.voice_verification_attempts FOR INSERT
  WITH CHECK (true);

-- Admins can view all attempts
CREATE POLICY "Admins can view all verification attempts"
  ON public.voice_verification_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_voice_verification_attempts_user_created 
  ON public.voice_verification_attempts(user_id, created_at DESC);