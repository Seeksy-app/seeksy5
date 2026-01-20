-- Fix critical RLS data exposure issues

-- 1. Enable RLS on creators table (uses profile_id)
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own creator profile"
ON public.creators FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own creator profile"
ON public.creators FOR UPDATE
USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own creator profile"
ON public.creators FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all creators"
ON public.creators FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 2. Enable RLS on agency_discovery_profiles
ALTER TABLE public.agency_discovery_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agency discovery profiles"
ON public.agency_discovery_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view agency profiles"
ON public.agency_discovery_profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Enable RLS on advertiser_pricing_tiers
ALTER TABLE public.advertiser_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing tiers"
ON public.advertiser_pricing_tiers FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage pricing tiers"
ON public.advertiser_pricing_tiers FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 4. GTM Projects (uses owner_user_id)
ALTER TABLE public.gtm_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own GTM projects"
ON public.gtm_projects FOR SELECT
USING (owner_user_id = auth.uid());

CREATE POLICY "Users can manage their own GTM projects"
ON public.gtm_projects FOR ALL
USING (owner_user_id = auth.uid());

CREATE POLICY "Admins can view all GTM projects"
ON public.gtm_projects FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. GTM Channels (global reference table - admin only for write, read for all authenticated)
ALTER TABLE public.gtm_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view GTM channels"
ON public.gtm_channels FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage GTM channels"
ON public.gtm_channels FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 6. GTM Actions (uses gtm_project_id)
ALTER TABLE public.gtm_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage actions for their projects"
ON public.gtm_actions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gtm_projects 
    WHERE id = gtm_actions.gtm_project_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GTM actions"
ON public.gtm_actions FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 7. GTM Assumptions (uses gtm_project_id)
ALTER TABLE public.gtm_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage assumptions for their projects"
ON public.gtm_assumptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gtm_projects 
    WHERE id = gtm_assumptions.gtm_project_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GTM assumptions"
ON public.gtm_assumptions FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 8. GTM Metrics Snapshots (uses gtm_project_id)
ALTER TABLE public.gtm_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for their projects"
ON public.gtm_metrics_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.gtm_projects 
    WHERE id = gtm_metrics_snapshots.gtm_project_id 
    AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all GTM metrics"
ON public.gtm_metrics_snapshots FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));