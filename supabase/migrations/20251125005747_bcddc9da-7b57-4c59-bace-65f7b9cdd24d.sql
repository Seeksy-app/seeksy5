-- Allow anonymous users to validate investor access codes
CREATE POLICY "Anyone can validate active access codes"
ON investor_shares
FOR SELECT
TO public
USING (
  status = 'active' 
  AND expires_at > now()
  AND revoked_at IS NULL
);