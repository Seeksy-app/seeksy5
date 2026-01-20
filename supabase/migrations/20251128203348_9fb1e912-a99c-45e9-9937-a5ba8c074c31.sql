-- Seed Demo Advertisers (10)
INSERT INTO advertisers (id, company_name, contact_name, contact_email, business_description, status, owner_profile_id, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Acme Corp', 'John Smith', 'john@acmecorp.com', 'B2B software company running awareness and thought-leadership campaigns.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'TechStart', 'Sarah Johnson', 'sarah@techstart.com', 'Early-stage tech company promoting product launches and high-impact bursts.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'Global Solutions', 'Michael Chen', 'michael@globalsolutions.com', 'Global enterprise brand focused on evergreen brand awareness campaigns.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'HealthWave', 'Emily Davis', 'emily@healthwave.com', 'Health lifestyle brand leveraging podcast host-reads and creator content.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'BrightBank', 'Robert Martinez', 'robert@brightbank.com', 'Premium CPM financial advertiser driving education and acquisition campaigns.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'Mindful Living Co.', 'Jessica Lee', 'jessica@mindfulliving.com', 'Wellness and mindfulness brand running long-term evergreen activations.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'Rocket Retail', 'David Wilson', 'david@rocketretail.com', 'Seasonal retail brand running high-volume promotional campaigns.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'CampusNow', 'Amanda Taylor', 'amanda@campusnow.com', 'Education platform focusing on student awareness and course signups.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'GoGo Travel', 'Christopher Brown', 'chris@gogotravel.com', 'Travel brand targeting seasonal interest spikes and trip-planning audiences.', 'approved', NULL, now(), now()),
  (gen_random_uuid(), 'NextGen Fitness', 'Michelle Anderson', 'michelle@nextgenfitness.com', 'Fitness apparel and training company with seasonal new-year activations.', 'approved', NULL, now(), now())
ON CONFLICT DO NOTHING;

-- Seed Demo Ad Campaigns (10)
WITH advertiser_lookup AS (
  SELECT id, company_name FROM advertisers WHERE company_name IN (
    'Acme Corp', 'TechStart', 'Global Solutions', 'HealthWave', 'BrightBank',
    'Mindful Living Co.', 'Rocket Retail', 'CampusNow', 'GoGo Travel', 'NextGen Fitness'
  )
)
INSERT INTO ad_campaigns (
  id, advertiser_id, name, total_budget, cpm_bid, start_date, end_date, 
  status, campaign_type, total_spent, total_impressions, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  al.id,
  c.name,
  c.budget,
  c.cpm,
  c.start_date::date,
  c.end_date::date,
  c.status,
  'standard',
  c.spent,
  c.impressions,
  now(),
  now()
FROM (VALUES
  ('Acme Corp', 'Summer 2024 Campaign', 10000, 57, '2024-06-01', '2024-08-31', 'active', 7200, 125000),
  ('TechStart', 'Product Launch Q1', 15000, 75, '2024-01-01', '2024-03-31', 'completed', 15000, 200000),
  ('Global Solutions', 'Brand Awareness', 25000, 69, '2024-09-15', '2024-12-15', 'active', 12500, 180000),
  ('HealthWave', 'Feel Better Now', 8500, 62, '2024-10-01', '2024-11-30', 'active', 5600, 90000),
  ('BrightBank', 'Smart Money 2025', 30000, 85, '2025-01-01', '2025-03-31', 'active', 0, 0),
  ('Mindful Living Co.', 'Mindful Evergreen', 12000, 60, '2024-01-01', '2025-12-31', 'active', 6000, 100000),
  ('Rocket Retail', 'Holiday Push', 18000, 63, '2024-11-01', '2024-12-31', 'active', 10200, 160000),
  ('CampusNow', 'Back-to-School 2024', 7500, 68, '2024-08-01', '2024-09-15', 'completed', 7500, 110000),
  ('GoGo Travel', 'Spring Escape', 20000, 77, '2024-02-01', '2024-05-01', 'completed', 20000, 260000),
  ('NextGen Fitness', 'New Year, New You', 9000, 54, '2024-12-15', '2025-02-15', 'active', 3800, 70000)
) AS c(advertiser_name, name, budget, cpm, start_date, end_date, status, spent, impressions)
JOIN advertiser_lookup al ON al.company_name = c.advertiser_name
ON CONFLICT DO NOTHING;

-- Seed Ad Inventory Units (8 units) with valid placement and type values
INSERT INTO ad_inventory_units (
  id, name, slug, type, placement, floor_cpm, ceiling_cpm, target_cpm, 
  expected_monthly_impressions, seasonality_factor, is_active, created_at, updated_at
)
VALUES
  (gen_random_uuid(), 'Creator Page Display', 'creator-page-display', 'creator_page', 'display', 12, 30, 14, 100000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Event Sponsorship', 'event-sponsorship', 'event', 'sponsorship_package', 30, 80, 63, 15000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Livestream Mid-Roll', 'livestream-midroll', 'livestream', 'mid', 22, 55, 36, 35000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Podcast Host-Read Pre-Roll', 'podcast-preroll', 'podcast', 'pre', 18, 45, 32, 22000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Podcast Host-Read Mid-Roll', 'podcast-midroll', 'podcast', 'mid', 20, 50, 34, 26000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Newsletter Feature', 'newsletter-feature', 'newsletter', 'display', 10, 28, 19, 40000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'App Audio Placement', 'app-audio', 'other', 'mid', 8, 22, 15, 30000, 1.0, true, now(), now()),
  (gen_random_uuid(), 'Lead Pixel Retargeting', 'lead-pixel', 'other', 'display', 15, 40, 24, 50000, 1.0, true, now(), now())
ON CONFLICT DO NOTHING;

-- Seed Rate Cards for Q1 2025
WITH inventory_lookup AS (
  SELECT id, slug FROM ad_inventory_units
)
INSERT INTO ad_rate_cards (
  id, inventory_unit_id, year, quarter, recommended_cpm, scenario_slug, 
  bulk_discount_cpm, min_commit_impressions, notes, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  il.id,
  2025,
  1,
  rc.cpm,
  'base',
  rc.cpm * 0.85,
  50000,
  'Q1 2025 Base Scenario',
  now(),
  now()
FROM (VALUES
  ('podcast-preroll', 32),
  ('podcast-midroll', 32),
  ('livestream-midroll', 36),
  ('event-sponsorship', 63),
  ('creator-page-display', 14),
  ('newsletter-feature', 19),
  ('app-audio', 15),
  ('lead-pixel', 24)
) AS rc(slug, cpm)
JOIN inventory_lookup il ON il.slug = rc.slug
ON CONFLICT DO NOTHING;