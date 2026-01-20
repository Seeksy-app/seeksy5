-- Add policy for authenticated users to read market_intelligence_insights
CREATE POLICY "Authenticated users can view insights" 
ON public.market_intelligence_insights 
FOR SELECT 
TO authenticated
USING (true);

-- Add policy for authenticated users to read market_intelligence_sources
CREATE POLICY "Authenticated users can view sources" 
ON public.market_intelligence_sources 
FOR SELECT 
TO authenticated
USING (true);