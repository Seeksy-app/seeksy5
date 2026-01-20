ALTER TABLE public.investor_application_settings 
ADD COLUMN price_per_share_tier2 DECIMAL(10, 4) DEFAULT NULL,
ADD COLUMN tier2_start_date DATE DEFAULT NULL;