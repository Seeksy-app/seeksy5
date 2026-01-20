-- Make feed_id nullable in rd_feed_items for YouTube/PDF uploads without a feed
ALTER TABLE public.rd_feed_items 
ALTER COLUMN feed_id DROP NOT NULL;