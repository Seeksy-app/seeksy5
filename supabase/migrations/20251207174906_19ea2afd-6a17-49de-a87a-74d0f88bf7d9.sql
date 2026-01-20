-- Add scan frequency settings to protected_content table
ALTER TABLE public.protected_content 
ADD COLUMN IF NOT EXISTS scan_frequency TEXT DEFAULT 'auto' CHECK (scan_frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'auto', 'disabled')),
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_scan_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_scans INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_spent INTEGER DEFAULT 0;

-- Create user scan settings table for global defaults
CREATE TABLE IF NOT EXISTS public.content_scan_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_frequency TEXT DEFAULT 'auto' CHECK (default_frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'auto', 'disabled')),
  auto_scan_enabled BOOLEAN DEFAULT true,
  notify_on_match BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.content_scan_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scan settings"
  ON public.content_scan_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan settings"
  ON public.content_scan_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan settings"
  ON public.content_scan_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create scan credit costs table
CREATE TABLE IF NOT EXISTS public.scan_credit_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frequency TEXT NOT NULL UNIQUE CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  credits_per_scan INTEGER NOT NULL,
  description TEXT
);

-- Insert default credit costs
INSERT INTO public.scan_credit_costs (frequency, credits_per_scan, description) VALUES
  ('hourly', 5, 'Real-time monitoring for new releases'),
  ('daily', 2, 'Active content protection'),
  ('weekly', 1, 'Standard monitoring'),
  ('monthly', 0, 'Basic monitoring (free)')
ON CONFLICT (frequency) DO NOTHING;

-- Allow public read of credit costs
ALTER TABLE public.scan_credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scan credit costs"
  ON public.scan_credit_costs FOR SELECT
  USING (true);

-- Create index for efficient scan scheduling
CREATE INDEX IF NOT EXISTS idx_protected_content_next_scan 
  ON public.protected_content (next_scan_at) 
  WHERE next_scan_at IS NOT NULL;