-- Create ad_opportunities table for the advertiser → admin → creator workflow
CREATE TABLE IF NOT EXISTS public.ad_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT 'host_read', -- host_read, pre_roll, post_roll, branded_segment, video_integration, event_sponsorship
  payout_type TEXT NOT NULL DEFAULT 'flat', -- flat, revshare, hybrid
  payout_amount NUMERIC(10,2),
  revshare_percent NUMERIC(5,2),
  eligibility_tags TEXT[] DEFAULT '{}',
  max_creators INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage ad opportunities"
ON public.ad_opportunities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view published opportunities"
ON public.ad_opportunities
FOR SELECT
USING (status = 'published' AND auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_ad_opportunities_updated_at
  BEFORE UPDATE ON public.ad_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();