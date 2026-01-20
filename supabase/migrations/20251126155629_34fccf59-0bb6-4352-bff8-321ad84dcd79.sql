-- Add payment_method column to client_tickets
ALTER TABLE client_tickets 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add comment explaining the status values
COMMENT ON COLUMN client_tickets.status IS 'Possible values: created, open, proposal_sent, scheduled, in_progress, complete, resolved, closed';

-- Add comment explaining payment method values
COMMENT ON COLUMN client_tickets.payment_method IS 'Possible values: stripe_ach, stripe_card, cash, check, zelle, venmo, other';