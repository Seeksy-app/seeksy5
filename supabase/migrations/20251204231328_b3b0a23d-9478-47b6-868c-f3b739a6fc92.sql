-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cfo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cmo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cco';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';