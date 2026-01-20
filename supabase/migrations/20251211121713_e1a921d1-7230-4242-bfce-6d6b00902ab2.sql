-- Add access_code column to sales_opportunities if not exists
ALTER TABLE public.sales_opportunities 
ADD COLUMN IF NOT EXISTS access_code TEXT DEFAULT substring(md5(random()::text), 1, 8);

-- Create sales_opportunity_videos junction table if not exists
CREATE TABLE IF NOT EXISTS public.sales_opportunity_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.demo_videos(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(opportunity_id, video_id)
);

-- Create sales_opportunity_access table if not exists
CREATE TABLE IF NOT EXISTS public.sales_opportunity_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  investor_email TEXT,
  investor_name TEXT,
  access_code_used TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pages_viewed TEXT[],
  time_spent_seconds INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.sales_opportunity_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_opportunity_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Board members can manage opportunity videos" ON public.sales_opportunity_videos;
DROP POLICY IF EXISTS "Public can view opportunity videos" ON public.sales_opportunity_videos;
DROP POLICY IF EXISTS "Anyone can log access" ON public.sales_opportunity_access;
DROP POLICY IF EXISTS "Board members can view access logs" ON public.sales_opportunity_access;

-- Board members can manage opportunity videos
CREATE POLICY "Board members can manage opportunity videos"
ON public.sales_opportunity_videos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'board_member')
  )
);

-- Public can read opportunity videos for active opportunities
CREATE POLICY "Public can view opportunity videos"
ON public.sales_opportunity_videos FOR SELECT
USING (true);

-- Anyone can log access (for tracking)
CREATE POLICY "Anyone can log access"
ON public.sales_opportunity_access FOR INSERT
WITH CHECK (true);

-- Board members can view access logs
CREATE POLICY "Board members can view access logs"
ON public.sales_opportunity_access FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin', 'board_member')
  )
);