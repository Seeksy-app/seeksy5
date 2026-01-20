-- Add share_config column to investor_shares table for storing share preferences

ALTER TABLE public.investor_shares
ADD COLUMN IF NOT EXISTS share_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.investor_shares.share_config IS 'Configuration for shared proforma: proformaType, adjustmentMultiplier, allowHtmlView, allowDownload, useRealTimeData';