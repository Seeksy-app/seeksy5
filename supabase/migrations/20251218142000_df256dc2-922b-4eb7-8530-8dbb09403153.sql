-- Make the meeting-recordings bucket public so audio can be played
UPDATE storage.buckets 
SET public = true 
WHERE id = 'meeting-recordings';