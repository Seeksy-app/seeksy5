
-- First clean up orphaned audit records
DELETE FROM ticket_audit_log 
WHERE ticket_id NOT IN (SELECT id FROM tickets);

-- Now drop and recreate the trigger to not fail on missing tickets
DROP TRIGGER IF EXISTS log_ticket_audit_trigger ON tickets;
