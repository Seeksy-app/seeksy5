-- Ensure storage bucket exists with proper configuration
DO $$ 
BEGIN
  -- Check if avatars bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      5242880, -- 5MB limit
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    );
  END IF;
END $$;

-- Ensure RLS policies exist for avatars bucket
DO $$
BEGIN
  -- Drop existing policies if they exist to recreate them
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
  
  -- Public read access
  CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

  -- Authenticated users can upload to their own folder
  CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

  -- Authenticated users can update their own files
  CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

  -- Authenticated users can delete their own files
  CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
END $$;