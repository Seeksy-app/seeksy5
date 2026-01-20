-- Add email column to advertiser_team_members
ALTER TABLE advertiser_team_members
ADD COLUMN email TEXT;

-- Add unique constraint on (advertiser_id, email)
ALTER TABLE advertiser_team_members
ADD CONSTRAINT advertiser_team_members_advertiser_email_unique UNIQUE (advertiser_id, email);