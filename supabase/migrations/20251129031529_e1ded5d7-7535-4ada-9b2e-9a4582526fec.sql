
-- Drop the existing check constraint
ALTER TABLE ai_edited_assets DROP CONSTRAINT IF EXISTS ai_edited_assets_output_type_check;

-- Add the updated constraint with vertical and thumbnail included
ALTER TABLE ai_edited_assets ADD CONSTRAINT ai_edited_assets_output_type_check 
CHECK (output_type IN ('video', 'audio', 'clip', 'short', 'enhanced', 'vertical', 'thumbnail'));
