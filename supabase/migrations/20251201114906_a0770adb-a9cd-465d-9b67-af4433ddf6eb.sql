-- Add is_default column to gmail_connections table
ALTER TABLE gmail_connections 
ADD COLUMN is_default BOOLEAN DEFAULT false;