-- =====================================================
-- DATA INTEGRITY & VERSION HISTORY SYSTEM
-- Ensures no user data is ever lost
-- =====================================================

-- 1. Data Version History Table (tracks all changes to critical user data)
CREATE TABLE IF NOT EXISTS public.data_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_version_history_record ON data_version_history(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_version_history_user ON data_version_history(user_id);
CREATE INDEX IF NOT EXISTS idx_version_history_created ON data_version_history(created_at DESC);

-- 2. Deleted Items Recovery Table (soft delete mirror)
CREATE TABLE IF NOT EXISTS public.deleted_items_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_table TEXT NOT NULL,
  original_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  deleted_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_by UUID REFERENCES auth.users(id),
  recovery_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
  is_recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  recovered_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_deleted_items_user ON deleted_items_recovery(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_items_table ON deleted_items_recovery(original_table, original_id);
CREATE INDEX IF NOT EXISTS idx_deleted_items_expires ON deleted_items_recovery(recovery_expires_at) WHERE NOT is_recovered;

-- 3. System Health Log (tracks write failures, sync errors)
CREATE TABLE IF NOT EXISTS public.system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('write_failure', 'sync_error', 'webhook_failure', 'duplicate_id', 'permission_denied', 'validation_error', 'recovery_attempt')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  table_name TEXT,
  record_id UUID,
  user_id UUID,
  error_message TEXT,
  error_details JSONB,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_log_type ON system_health_log(event_type);
CREATE INDEX IF NOT EXISTS idx_health_log_severity ON system_health_log(severity) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_health_log_created ON system_health_log(created_at DESC);

-- 4. Contact History Table (specific failsafe for contacts)
CREATE TABLE IF NOT EXISTS public.contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'restored')),
  changed_fields TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_contact_history_contact ON contact_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_user ON contact_history(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_history_version ON contact_history(contact_id, version_number);

-- 5. Autosave Drafts Table (for frontend autosave)
CREATE TABLE IF NOT EXISTS public.autosave_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_id TEXT,
  draft_data JSONB NOT NULL,
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(user_id, form_type, form_id)
);

CREATE INDEX IF NOT EXISTS idx_autosave_user ON autosave_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_autosave_expires ON autosave_drafts(expires_at);

-- 6. Function to log version history
CREATE OR REPLACE FUNCTION public.log_data_version()
RETURNS TRIGGER AS $$
DECLARE
  changed_cols TEXT[];
BEGIN
  -- Calculate changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO changed_cols
    FROM jsonb_each(to_jsonb(NEW)) AS n(key, val)
    WHERE to_jsonb(OLD) -> key IS DISTINCT FROM val;
  END IF;

  INSERT INTO public.data_version_history (
    table_name,
    record_id,
    user_id,
    operation,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    changed_cols
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Function to log deleted items for recovery
CREATE OR REPLACE FUNCTION public.log_deleted_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.deleted_items_recovery (
    original_table,
    original_id,
    user_id,
    deleted_data,
    deleted_by
  ) VALUES (
    TG_TABLE_NAME,
    OLD.id,
    OLD.user_id,
    to_jsonb(OLD),
    auth.uid()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Function to log contact changes specifically
CREATE OR REPLACE FUNCTION public.log_contact_history()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  changed_cols TEXT[];
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.contact_history
  WHERE contact_id = COALESCE(NEW.id, OLD.id);

  -- Calculate changed fields for UPDATE
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO changed_cols
    FROM jsonb_each(to_jsonb(NEW)) AS n(key, val)
    WHERE to_jsonb(OLD) -> key IS DISTINCT FROM val;
  END IF;

  INSERT INTO public.contact_history (
    contact_id,
    user_id,
    version_number,
    snapshot,
    change_type,
    changed_fields,
    created_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    next_version,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    changed_cols,
    auth.uid()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Apply version history trigger to contacts table
DROP TRIGGER IF EXISTS contacts_version_history ON contacts;
CREATE TRIGGER contacts_version_history
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_contact_history();

-- 10. Apply deleted item recovery trigger to contacts
DROP TRIGGER IF EXISTS contacts_deleted_recovery ON contacts;
CREATE TRIGGER contacts_deleted_recovery
  BEFORE DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_deleted_item();

-- 11. Function to restore a deleted item
CREATE OR REPLACE FUNCTION public.restore_deleted_item(
  p_recovery_id UUID
)
RETURNS JSONB AS $$
DECLARE
  recovery_record RECORD;
  result JSONB;
BEGIN
  -- Get the recovery record
  SELECT * INTO recovery_record
  FROM public.deleted_items_recovery
  WHERE id = p_recovery_id AND NOT is_recovered;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recovery record not found or already recovered');
  END IF;

  -- Mark as recovered
  UPDATE public.deleted_items_recovery
  SET 
    is_recovered = true,
    recovered_at = now(),
    recovered_by = auth.uid()
  WHERE id = p_recovery_id;

  -- Log the recovery attempt
  INSERT INTO public.system_health_log (
    event_type, severity, table_name, record_id, user_id, error_message
  ) VALUES (
    'recovery_attempt', 'info', recovery_record.original_table, recovery_record.original_id, auth.uid(),
    'Item restored from deleted_items_recovery'
  );

  RETURN jsonb_build_object(
    'success', true,
    'table', recovery_record.original_table,
    'data', recovery_record.deleted_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. Enable RLS on all new tables
ALTER TABLE public.data_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_items_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autosave_drafts ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies

-- data_version_history: Users can view their own data history, admins can view all
CREATE POLICY "Users can view own version history"
  ON public.data_version_history FOR SELECT
  USING (user_id = auth.uid() OR public.is_adm());

-- deleted_items_recovery: Users can view their own deleted items, admins can view all
CREATE POLICY "Users can view own deleted items"
  ON public.deleted_items_recovery FOR SELECT
  USING (user_id = auth.uid() OR public.is_adm());

CREATE POLICY "Admins can restore any deleted items"
  ON public.deleted_items_recovery FOR UPDATE
  USING (public.is_adm());

-- system_health_log: Only admins can view
CREATE POLICY "Admins can view system health logs"
  ON public.system_health_log FOR SELECT
  USING (public.is_adm());

CREATE POLICY "System can insert health logs"
  ON public.system_health_log FOR INSERT
  WITH CHECK (true);

-- contact_history: Users can view their own contact history
CREATE POLICY "Users can view own contact history"
  ON public.contact_history FOR SELECT
  USING (user_id = auth.uid() OR public.is_adm());

-- autosave_drafts: Users can manage their own drafts
CREATE POLICY "Users can manage own autosave drafts"
  ON public.autosave_drafts FOR ALL
  USING (user_id = auth.uid());

-- 14. Function to cleanup expired autosave drafts (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_autosaves()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.autosave_drafts
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Function to get contact version at specific point in time
CREATE OR REPLACE FUNCTION public.get_contact_version(
  p_contact_id UUID,
  p_version INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  IF p_version IS NULL THEN
    -- Get latest version
    SELECT snapshot INTO result
    FROM public.contact_history
    WHERE contact_id = p_contact_id
    ORDER BY version_number DESC
    LIMIT 1;
  ELSE
    -- Get specific version
    SELECT snapshot INTO result
    FROM public.contact_history
    WHERE contact_id = p_contact_id AND version_number = p_version;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;