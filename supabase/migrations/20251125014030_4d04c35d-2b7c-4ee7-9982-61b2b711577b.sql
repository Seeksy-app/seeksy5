-- Update tickets table to reference contacts instead of clients
-- First, drop the old foreign key if it exists
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

-- Rename client_id to contact_id for clarity
ALTER TABLE tickets 
RENAME COLUMN client_id TO contact_id;

-- Add foreign key to contacts table
ALTER TABLE tickets
ADD CONSTRAINT tickets_contact_id_fkey 
FOREIGN KEY (contact_id) 
REFERENCES contacts(id) 
ON DELETE SET NULL;