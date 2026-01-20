-- Add missing content_type column to tv_content table
ALTER TABLE public.tv_content 
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'video';