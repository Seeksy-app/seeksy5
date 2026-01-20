-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move existing extensions from public to extensions schema
-- This is a best practice to keep the public schema clean

-- Note: Some extensions may already be in the correct schema
-- This migration is idempotent and safe to run multiple times

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- If you have specific extensions in public schema, they should be moved here
-- Common extensions that might be in public:
-- ALTER EXTENSION IF EXISTS "uuid-ossp" SET SCHEMA extensions;
-- ALTER EXTENSION IF EXISTS "pgcrypto" SET SCHEMA extensions;

-- Add extensions schema to search path for all roles
ALTER DATABASE postgres SET search_path TO public, extensions;