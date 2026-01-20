-- Add usage toggles and tracking action preferences to email_signatures
ALTER TABLE public.email_signatures
ADD COLUMN IF NOT EXISTS use_in_gmail boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS use_in_seeksy_mail boolean DEFAULT true;

-- Add tracking action preferences to signature_notification_settings
ALTER TABLE public.signature_notification_settings
ADD COLUMN IF NOT EXISTS auto_create_contact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_create_contact_action boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_create_task_action boolean DEFAULT true;