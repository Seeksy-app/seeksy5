-- Drop the foreign key constraint to modules table
ALTER TABLE user_modules DROP CONSTRAINT IF EXISTS user_modules_module_id_fkey;

-- Now change the column type from UUID to TEXT
ALTER TABLE user_modules ALTER COLUMN module_id TYPE TEXT;

-- Re-add unique constraint (may already exist)
ALTER TABLE user_modules DROP CONSTRAINT IF EXISTS user_modules_user_id_module_id_key;
ALTER TABLE user_modules ADD CONSTRAINT user_modules_user_id_module_id_key UNIQUE (user_id, module_id);