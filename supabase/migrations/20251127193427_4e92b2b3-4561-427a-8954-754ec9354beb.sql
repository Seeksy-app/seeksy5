-- Add profile image URL column to creator_voice_profiles table
ALTER TABLE creator_voice_profiles
ADD COLUMN profile_image_url TEXT;

COMMENT ON COLUMN creator_voice_profiles.profile_image_url IS 'URL to the creator profile photo for this voice - helps advertisers identify and connect with the voice personality';