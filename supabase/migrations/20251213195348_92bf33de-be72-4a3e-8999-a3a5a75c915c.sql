-- Create table to track investor application access
CREATE TABLE public.investor_application_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.investor_application_access_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all logs
CREATE POLICY "Admins can view access logs" 
ON public.investor_application_access_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow public insert for tracking
CREATE POLICY "Allow public insert for tracking" 
ON public.investor_application_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_investor_access_logs_email ON public.investor_application_access_logs(email);
CREATE INDEX idx_investor_access_logs_accessed_at ON public.investor_application_access_logs(accessed_at DESC);