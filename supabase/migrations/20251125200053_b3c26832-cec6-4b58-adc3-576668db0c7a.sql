-- Add database trigger to send SMS to super admin when new user signs up
CREATE OR REPLACE FUNCTION notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Get user email and name
  SELECT email, raw_user_meta_data->>'full_name' 
  INTO user_email, user_name
  FROM auth.users
  WHERE id = NEW.id;

  -- Call edge function to send SMS (runs asynchronously)
  PERFORM net.http_post(
    url := 'https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/send-admin-new-user-sms',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheHFjaW9oZXFkcXRsbWplYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTcwOTMsImV4cCI6MjA3OTU3MzA5M30.l_qol40MY-M2A7rRxpI8H7r5hSh_PpzZTmk5q08wrpw"}'::jsonb,
    body := json_build_object(
      'userId', NEW.id,
      'userEmail', user_email,
      'userName', COALESCE(user_name, 'Unknown')
    )::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table insert (fires after user is created)
DROP TRIGGER IF EXISTS trigger_notify_admin_new_user ON public.profiles;
CREATE TRIGGER trigger_notify_admin_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_user();