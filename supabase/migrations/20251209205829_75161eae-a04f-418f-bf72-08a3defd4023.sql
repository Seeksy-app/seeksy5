-- Create table for user feedback during onboarding
CREATE TABLE public.onboarding_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  comment TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (including anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON public.onboarding_feedback
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.onboarding_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create index for analytics
CREATE INDEX idx_onboarding_feedback_page ON public.onboarding_feedback(page_path);
CREATE INDEX idx_onboarding_feedback_sentiment ON public.onboarding_feedback(sentiment);
CREATE INDEX idx_onboarding_feedback_created ON public.onboarding_feedback(created_at);