-- Add public read access for rd_feed_items (admin-only write remains)
CREATE POLICY "Anyone can view rd_feed_items" 
ON public.rd_feed_items 
FOR SELECT 
USING (true);

-- Add public read access for rd_insights (admin-only write remains)
CREATE POLICY "Anyone can view rd_insights" 
ON public.rd_insights 
FOR SELECT 
USING (true);