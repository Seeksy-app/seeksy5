-- Allow gmail_message_id to be nullable for inbound emails from Resend webhook
ALTER TABLE inbox_messages ALTER COLUMN gmail_message_id DROP NOT NULL;