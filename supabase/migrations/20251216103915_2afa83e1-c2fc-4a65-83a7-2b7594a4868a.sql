-- Add board_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'board_admin';

-- Remove super_admin role from board@seeksy.dev (keep board_member)
DELETE FROM public.user_roles 
WHERE user_id = 'aa207ae0-0da1-498f-b789-b1ff073cdf94' 
AND role = 'super_admin';