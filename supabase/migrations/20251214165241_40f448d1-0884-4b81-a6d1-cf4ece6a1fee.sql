-- Add add-on pricing columns to investor_application_settings
ALTER TABLE investor_application_settings 
ADD COLUMN IF NOT EXISTS addon_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_price_per_share numeric(10,4),
ADD COLUMN IF NOT EXISTS addon_max_amount numeric(12,2) DEFAULT 5000,
ADD COLUMN IF NOT EXISTS addon_increment numeric(12,2) DEFAULT 1000,
ADD COLUMN IF NOT EXISTS addon_start_date date,
ADD COLUMN IF NOT EXISTS addon_end_date date;

-- Add addon_amount to legal_doc_instances for tracking
ALTER TABLE legal_doc_instances 
ADD COLUMN IF NOT EXISTS addon_amount numeric(12,2) DEFAULT 0;