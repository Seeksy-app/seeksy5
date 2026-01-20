-- Allow users to view contacts that are linked to their proposals
CREATE POLICY "Users can view contacts in their proposals"
ON contacts
FOR SELECT
USING (
  id IN (
    SELECT client_contact_id 
    FROM proposals 
    WHERE user_id = auth.uid()
  )
);