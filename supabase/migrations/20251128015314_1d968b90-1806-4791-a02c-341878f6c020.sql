-- Fix RLS policies for revenue_forecasts table (missing policies)
CREATE POLICY "Admins can view all forecasts" ON public.revenue_forecasts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert forecasts" ON public.revenue_forecasts
  FOR INSERT WITH CHECK (true);