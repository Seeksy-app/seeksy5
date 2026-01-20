-- Set default user_id for tasks table to Andrew Appleton's admin account
ALTER TABLE public.tasks 
ALTER COLUMN user_id SET DEFAULT '8b55af5a-dc7f-40e0-800f-78e6a11b4c69'::uuid;