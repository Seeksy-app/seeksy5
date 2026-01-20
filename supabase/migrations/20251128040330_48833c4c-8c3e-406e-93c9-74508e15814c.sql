-- Seed demo voice detections for demo account
-- This migration creates 5 sample detections to showcase the voice monitoring dashboard

DO $$
DECLARE
  demo_user_id uuid;
  demo_fingerprint_id uuid;
BEGIN
  -- Find the first user (typically the creator's account for demos)
  SELECT id INTO demo_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found - skipping demo seed';
    RETURN;
  END IF;

  -- Check if this user has a voice fingerprint
  SELECT id INTO demo_fingerprint_id
  FROM public.voice_fingerprints
  WHERE user_id = demo_user_id
  LIMIT 1;

  -- If no fingerprint, create one for demo purposes
  IF demo_fingerprint_id IS NULL THEN
    INSERT INTO public.voice_fingerprints (
      user_id,
      credential_id,
      fingerprint_id,
      status
    ) VALUES (
      demo_user_id,
      gen_random_uuid()::text,
      'demo_fingerprint_' || gen_random_uuid()::text,
      'active'
    )
    RETURNING id INTO demo_fingerprint_id;
  END IF;

  -- Insert 5 demo voice detections with realistic data
  INSERT INTO public.voice_detections (
    user_id,
    voice_fingerprint_id,
    platform,
    source_type,
    source_id,
    source_title,
    source_url,
    detected_at,
    first_spoken_at_sec,
    last_spoken_at_sec,
    confidence,
    usage_category,
    status,
    notes,
    raw_metadata
  ) VALUES
  -- YouTube video appearance
  (
    demo_user_id,
    demo_fingerprint_id,
    'youtube',
    'video',
    'dQw4w9WgXcQ',
    'Podcast Interview: The Future of AI Voice Technology',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    NOW() - INTERVAL '2 days',
    45.3,
    127.8,
    0.94,
    'appearance',
    'reviewed',
    'Guest appearance on tech podcast',
    '{"video_duration": 1823, "channel": "Tech Insights Weekly", "views": 45230}'::jsonb
  ),
  -- Spotify podcast ad read
  (
    demo_user_id,
    demo_fingerprint_id,
    'spotify',
    'podcast_episode',
    'ep_abc123def456',
    'Marketing Masters Podcast - Episode 47',
    'https://open.spotify.com/episode/abc123def456',
    NOW() - INTERVAL '5 days',
    320.5,
    355.2,
    0.91,
    'ad_read',
    'licensed',
    'Authorized sponsored ad read',
    '{"episode_duration": 2845, "show": "Marketing Masters", "listeners": 12450}'::jsonb
  ),
  -- TikTok video clip
  (
    demo_user_id,
    demo_fingerprint_id,
    'tiktok',
    'short_form',
    'tiktok_7234567890',
    'Quick Tips for Content Creators',
    'https://tiktok.com/@creator/video/7234567890',
    NOW() - INTERVAL '1 day',
    0.0,
    15.8,
    0.88,
    'narration',
    'unreviewed',
    NULL,
    '{"video_duration": 15.8, "likes": 8234, "shares": 432}'::jsonb
  ),
  -- Instagram Story appearance
  (
    demo_user_id,
    demo_fingerprint_id,
    'instagram',
    'short_form',
    'ig_story_xyz789',
    'Behind the Scenes at Seeksy HQ',
    'https://instagram.com/p/xyz789',
    NOW() - INTERVAL '3 hours',
    2.1,
    8.5,
    0.86,
    'appearance',
    'unreviewed',
    NULL,
    '{"story_views": 2340, "account": "seeksy_official"}'::jsonb
  ),
  -- Twitter Spaces audio
  (
    demo_user_id,
    demo_fingerprint_id,
    'twitter',
    'live_stream',
    'spaces_def456ghi',
    'Creator Economy Roundtable Discussion',
    'https://twitter.com/i/spaces/def456ghi',
    NOW() - INTERVAL '7 days',
    180.0,
    945.3,
    0.92,
    'appearance',
    'reviewed',
    'Panel discussion participant',
    '{"space_duration": 3600, "listeners": 1250, "host": "@CreatorEconomy"}'::jsonb
  );

  RAISE NOTICE 'Successfully seeded 5 demo voice detections for user %', demo_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error seeding demo voice detections: %', SQLERRM;
END $$;