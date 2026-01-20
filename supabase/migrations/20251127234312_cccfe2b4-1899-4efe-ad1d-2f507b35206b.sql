-- Make slug nullable so TypeScript types generate correctly
-- The trigger will still auto-populate it
ALTER TABLE public.podcasts 
ALTER COLUMN slug DROP NOT NULL;