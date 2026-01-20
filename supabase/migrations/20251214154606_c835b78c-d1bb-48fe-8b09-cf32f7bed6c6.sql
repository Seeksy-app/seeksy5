-- Add maximum_investment column for tier-based caps
ALTER TABLE public.investor_application_settings 
ADD COLUMN IF NOT EXISTS maximum_investment DECIMAL(10, 2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.investor_application_settings.maximum_investment IS 'Maximum investment amount for this tier/offering. NULL means no cap.';