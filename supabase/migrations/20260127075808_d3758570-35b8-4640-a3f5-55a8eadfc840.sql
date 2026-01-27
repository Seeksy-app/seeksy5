-- =====================================================
-- COMPREHENSIVE SCHEMA: All missing tables for build
-- =====================================================

-- 1. APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app_settings" ON public.app_settings FOR ALL USING (is_admin(auth.uid()));

-- 2. MEDIA FILES
CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  duration_seconds numeric,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own media" ON public.media_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own media" ON public.media_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own media" ON public.media_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own media" ON public.media_files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all media" ON public.media_files FOR SELECT USING (is_admin(auth.uid()));

-- 3. AI JOBS
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_type text NOT NULL,
  status text DEFAULT 'pending',
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON public.ai_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create jobs" ON public.ai_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all jobs" ON public.ai_jobs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage all jobs" ON public.ai_jobs FOR ALL USING (is_admin(auth.uid()));

-- 4. ADVERTISERS
CREATE TABLE IF NOT EXISTS public.advertisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_email text,
  contact_phone text,
  website text,
  industry text,
  budget numeric DEFAULT 0,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own advertiser" ON public.advertisers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own advertiser" ON public.advertisers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all advertisers" ON public.advertisers FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage all advertisers" ON public.advertisers FOR ALL USING (is_admin(auth.uid()));

-- 5. ADVERTISER TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.advertiser_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES public.advertisers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.advertiser_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advertisers can view own transactions" ON public.advertiser_transactions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.advertisers WHERE id = advertiser_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage transactions" ON public.advertiser_transactions FOR ALL USING (is_admin(auth.uid()));

-- 6. TICKETS
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_number text UNIQUE NOT NULL DEFAULT ('TKT-' || substr(gen_random_uuid()::text, 1, 8)),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON public.tickets FOR ALL USING (is_admin(auth.uid()));

-- 7. AUDIO ADS
CREATE TABLE IF NOT EXISTS public.audio_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  script text,
  audio_url text,
  duration_seconds numeric,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.audio_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audio ads" ON public.audio_ads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own audio ads" ON public.audio_ads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audio ads" ON public.audio_ads FOR SELECT USING (is_admin(auth.uid()));

-- 8. AAR MEDIA
CREATE TABLE IF NOT EXISTS public.aar_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text,
  caption text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.aar_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own aar_media" ON public.aar_media FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own aar_media" ON public.aar_media FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all aar_media" ON public.aar_media FOR SELECT USING (is_admin(auth.uid()));

-- 9. EMAIL FOLDERS
CREATE TABLE IF NOT EXISTS public.email_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own folders" ON public.email_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own folders" ON public.email_folders FOR ALL USING (auth.uid() = user_id);

-- 10. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id uuid REFERENCES public.email_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON public.email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all templates" ON public.email_templates FOR SELECT USING (is_admin(auth.uid()));

-- 11. CUSTOM PACKAGES
CREATE TABLE IF NOT EXISTS public.custom_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.custom_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own packages" ON public.custom_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own packages" ON public.custom_packages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all packages" ON public.custom_packages FOR SELECT USING (is_admin(auth.uid()));

-- 12. USER MODULES
CREATE TABLE IF NOT EXISTS public.user_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_name text NOT NULL,
  is_enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_name)
);
ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own modules" ON public.user_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own modules" ON public.user_modules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all modules" ON public.user_modules FOR SELECT USING (is_admin(auth.uid()));

-- 13. Add missing columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS my_page_video_type text,
  ADD COLUMN IF NOT EXISTS my_page_video_id text,
  ADD COLUMN IF NOT EXISTS my_page_video_loop boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_full_name text,
  ADD COLUMN IF NOT EXISTS account_avatar_url text;

-- 14. Update triggers for updated_at
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON public.media_files 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_jobs_updated_at BEFORE UPDATE ON public.ai_jobs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_advertisers_updated_at BEFORE UPDATE ON public.advertisers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_audio_ads_updated_at BEFORE UPDATE ON public.audio_ads 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_packages_updated_at BEFORE UPDATE ON public.custom_packages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_modules_updated_at BEFORE UPDATE ON public.user_modules 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();