-- Set default assigned_to for tasks table to match user_id default (Andrew Appleton's admin account)
ALTER TABLE public.tasks 
ALTER COLUMN assigned_to SET DEFAULT '8b55af5a-dc7f-40e0-800f-78e6a11b4c69'::uuid;