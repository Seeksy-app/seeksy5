-- Add face-specific columns to identity_assets table
ALTER TABLE identity_assets
ADD COLUMN IF NOT EXISTS face_hash TEXT,
ADD COLUMN IF NOT EXISTS face_metadata_uri TEXT;

-- Add face identity events to identity_access_logs action types
COMMENT ON COLUMN identity_access_logs.action IS 'Actions: certified, revoked, permission_changed, access_granted, access_denied, access_requested, face_started, face_verified, face_failed, face_revoked';

-- Create index on type for faster face/voice identity queries
CREATE INDEX IF NOT EXISTS idx_identity_assets_type ON identity_assets(type);
CREATE INDEX IF NOT EXISTS idx_identity_assets_user_type ON identity_assets(user_id, type);