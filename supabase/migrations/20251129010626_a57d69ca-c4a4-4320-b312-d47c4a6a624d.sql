-- Voice Identity Hub: Unified voice system
CREATE TABLE IF NOT EXISTS voice_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT,
  certification_status TEXT DEFAULT 'pending',
  clone_status TEXT DEFAULT 'not_started',
  blockchain_token_id TEXT,
  blockchain_network TEXT DEFAULT 'polygon',
  listens INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0,
  voice_profile_id UUID REFERENCES creator_voice_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id)
);

-- Enable RLS
ALTER TABLE voice_identity ENABLE ROW LEVEL SECURITY;

-- Creators can view/edit their own voice identity
CREATE POLICY "Creators manage own voice identity"
  ON voice_identity FOR ALL
  USING (auth.uid() = creator_id);

-- Admins can view all
CREATE POLICY "Admins view all voice identities"
  ON voice_identity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Creator Rankings for "Top 5 Seekys"
CREATE TABLE IF NOT EXISTS creator_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  listens INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  ai_momentum_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

-- Enable RLS
ALTER TABLE creator_rankings ENABLE ROW LEVEL SECURITY;

-- Everyone can view rankings (public leaderboard)
CREATE POLICY "Public can view rankings"
  ON creator_rankings FOR SELECT
  USING (true);

-- Admins can manage rankings
CREATE POLICY "Admins manage rankings"
  ON creator_rankings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Blog posts enhancement for auto-blog system
ALTER TABLE blog_posts 
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_desc TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS publish_to_master BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;