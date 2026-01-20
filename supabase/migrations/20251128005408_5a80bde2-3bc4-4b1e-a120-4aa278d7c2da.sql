-- CRITICAL SECURITY FIX: Phase 2 Final - Remaining sensitive tables with admin-only access

CREATE OR REPLACE FUNCTION drop_pol(t text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
    EXECUTE format('DROP POLICY %I ON %I', r.policyname, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION is_adm() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role);
$$;

-- INVOICES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('invoices');
CREATE POLICY "inv_usr" ON invoices FOR ALL USING (auth.uid() = user_id OR is_adm());

-- PROPOSALS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('proposals');
CREATE POLICY "prop_usr" ON proposals FOR ALL USING (auth.uid() = user_id OR is_adm());

-- CLIENT_TICKETS
ALTER TABLE client_tickets ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('client_tickets');
CREATE POLICY "tkt_usr" ON client_tickets FOR ALL USING (auth.uid() = assigned_to OR is_adm());

-- MULTI_CHANNEL_CAMPAIGNS (admin only - no user column found)
ALTER TABLE multi_channel_campaigns ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('multi_channel_campaigns');
CREATE POLICY "camp_adm" ON multi_channel_campaigns FOR ALL USING (is_adm());

-- EVENT_REGISTRATIONS (admin only for safety)
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('event_registrations');
CREATE POLICY "reg_adm" ON event_registrations FOR ALL USING (is_adm());

-- SALES_COMMISSIONS
ALTER TABLE sales_commissions ENABLE ROW LEVEL SECURITY;
SELECT drop_pol('sales_commissions');
CREATE POLICY "comm_adm" ON sales_commissions FOR ALL USING (is_adm());

DROP FUNCTION drop_pol(text);