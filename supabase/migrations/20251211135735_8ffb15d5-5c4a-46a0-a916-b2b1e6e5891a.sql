-- Create table for veteran calculator results persistence
CREATE TABLE public.veteran_calculator_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calculator_id TEXT NOT NULL,
  input_json JSONB NOT NULL,
  output_json JSONB NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veteran_calculator_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view their own calculator results"
ON public.veteran_calculator_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert their own calculator results"
ON public.veteran_calculator_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own results
CREATE POLICY "Users can delete their own calculator results"
ON public.veteran_calculator_results
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_veteran_calculator_results_user_calculator ON public.veteran_calculator_results(user_id, calculator_id);