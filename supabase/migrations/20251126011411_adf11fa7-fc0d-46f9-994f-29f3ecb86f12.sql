-- Add seeksy_studio as a valid location type option

-- Update location_type enum to include seeksy_studio
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'seeksy_studio';