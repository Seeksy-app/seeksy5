-- Add metadata column to meta_integrations
ALTER TABLE meta_integrations 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;