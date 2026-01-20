-- Create demo-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo-videos', 'demo-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for demo-videos bucket
CREATE POLICY "Anyone can view demo videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'demo-videos');

CREATE POLICY "Authenticated users can upload demo videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'demo-videos');

CREATE POLICY "Users can update their own demo videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'demo-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own demo videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'demo-videos' AND auth.uid()::text = (storage.foldername(name))[1]);