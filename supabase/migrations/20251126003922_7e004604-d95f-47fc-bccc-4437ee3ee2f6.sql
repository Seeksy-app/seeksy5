-- Move extensions from public to extensions schema
-- Skip extensions that don't support SET SCHEMA (like pg_net, http, pgsodium)

DO $$ 
DECLARE
    ext_schema TEXT;
BEGIN
    -- Check and move uuid-ossp if it exists in public
    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'uuid-ossp';
    
    IF ext_schema = 'public' THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
        RAISE NOTICE 'Moved uuid-ossp extension to extensions schema';
    END IF;
    
    -- Check and move pgcrypto if it exists in public
    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pgcrypto';
    
    IF ext_schema = 'public' THEN
        ALTER EXTENSION "pgcrypto" SET SCHEMA extensions;
        RAISE NOTICE 'Moved pgcrypto extension to extensions schema';
    END IF;
    
    -- Check and move pgjwt if it exists in public
    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pgjwt';
    
    IF ext_schema = 'public' THEN
        ALTER EXTENSION "pgjwt" SET SCHEMA extensions;
        RAISE NOTICE 'Moved pgjwt extension to extensions schema';
    END IF;

    -- Note: pg_net, http, and pgsodium extensions cannot be moved to a different schema
    -- These will remain in their current schema and that's expected behavior
    RAISE NOTICE 'Extensions that cannot be moved (pg_net, http, pgsodium) will remain in their current schema';
END $$;