
-- Add 'cloudflare_stream' to allowed engine values for ai_jobs
ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_engine_check;
ALTER TABLE ai_jobs ADD CONSTRAINT ai_jobs_engine_check 
  CHECK (engine IN ('lovable_ai', 'openai', 'gemini', 'internal', 'cloudflare_stream'));
