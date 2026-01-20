-- Add author column to podcasts table for RSS import
ALTER TABLE podcasts 
ADD COLUMN IF NOT EXISTS author TEXT;