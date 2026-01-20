-- Add admin profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_full_name TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS admin_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS admin_phone TEXT,
ADD COLUMN IF NOT EXISTS use_separate_admin_profile BOOLEAN DEFAULT false;