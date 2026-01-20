-- 1. social_media_profiles - Stores main IG/FB metadata
CREATE TABLE public.social_media_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  platform_user_id TEXT,
  username TEXT,
  profile_picture TEXT,
  account_type TEXT,
  biography TEXT,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  UNIQUE(user_id, platform, platform_user_id)
);

-- 2. social_media_posts - Stores every post pulled from Graph API
CREATE TABLE public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.social_media_profiles(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  media_type TEXT,
  permalink TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  saved INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, post_id)
);

-- 3. social_media_comments
CREATE TABLE public.social_media_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL,
  text TEXT,
  username TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, comment_id)
);

-- 4. social_insights_snapshots - Stores impressions, reach, clicks, etc.
CREATE TABLE public.social_insights_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.social_media_profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  website_clicks INTEGER DEFAULT 0,
  email_contacts INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  accounts_engaged INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX idx_social_media_profiles_user_id ON public.social_media_profiles(user_id);
CREATE INDEX idx_social_media_profiles_platform ON public.social_media_profiles(platform);
CREATE INDEX idx_social_media_posts_profile_id ON public.social_media_posts(profile_id);
CREATE INDEX idx_social_media_posts_timestamp ON public.social_media_posts(timestamp DESC);
CREATE INDEX idx_social_media_comments_post_id ON public.social_media_comments(post_id);
CREATE INDEX idx_social_insights_snapshots_profile_id ON public.social_insights_snapshots(profile_id);
CREATE INDEX idx_social_insights_snapshots_date ON public.social_insights_snapshots(snapshot_date DESC);

-- Enable RLS
ALTER TABLE public.social_media_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_insights_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_profiles
CREATE POLICY "Users can view their own profiles"
  ON public.social_media_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON public.social_media_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON public.social_media_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON public.social_media_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.social_media_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for social_media_posts
CREATE POLICY "Users can view posts from their profiles"
  ON public.social_media_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_profiles
      WHERE social_media_profiles.id = social_media_posts.profile_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage posts from their profiles"
  ON public.social_media_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_profiles
      WHERE social_media_profiles.id = social_media_posts.profile_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all posts"
  ON public.social_media_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for social_media_comments
CREATE POLICY "Users can view comments on their posts"
  ON public.social_media_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_posts
      JOIN public.social_media_profiles ON social_media_profiles.id = social_media_posts.profile_id
      WHERE social_media_posts.id = social_media_comments.post_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage comments on their posts"
  ON public.social_media_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_posts
      JOIN public.social_media_profiles ON social_media_profiles.id = social_media_posts.profile_id
      WHERE social_media_posts.id = social_media_comments.post_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all comments"
  ON public.social_media_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for social_insights_snapshots
CREATE POLICY "Users can view their own insights"
  ON public.social_insights_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_profiles
      WHERE social_media_profiles.id = social_insights_snapshots.profile_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own insights"
  ON public.social_insights_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_profiles
      WHERE social_media_profiles.id = social_insights_snapshots.profile_id
      AND social_media_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all insights"
  ON public.social_insights_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_media_profiles_updated_at
  BEFORE UPDATE ON public.social_media_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();

CREATE TRIGGER update_social_media_posts_updated_at
  BEFORE UPDATE ON public.social_media_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_social_updated_at();