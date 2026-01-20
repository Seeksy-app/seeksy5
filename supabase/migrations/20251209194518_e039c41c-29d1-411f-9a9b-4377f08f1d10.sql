
-- Drop the trigger completely from the tickets table
DROP FUNCTION IF EXISTS log_ticket_audit() CASCADE;

-- Delete the orphaned audit logs
DELETE FROM ticket_audit_log WHERE ticket_id NOT IN (SELECT id FROM tickets);
