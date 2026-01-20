import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MyPageTheme, defaultTheme } from "@/config/myPageThemes";
import { cn } from "@/lib/utils";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import { Card } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { PublicSectionRenderer } from "@/components/mypage-v2/PublicSectionRenderer";
import { MyPageSection } from "@/lib/mypage/sectionTypes";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  account_full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  account_avatar_url: string | null;
  theme_color: string | null;
  page_background_color: string | null;
  is_live_on_profile: boolean | null;
  live_video_url: string | null;
}

export default function MyPagePublic() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasVoiceCertification, setHasVoiceCertification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<MyPageTheme>(defaultTheme);
  const [sections, setSections] = useState<MyPageSection[]>([]);

  // If no username provided (root path matched incorrectly), skip loading
  const hasValidUsername = username && username.trim() !== '';

  useEffect(() => {
    if (hasValidUsername) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [username, hasValidUsername]);

  const loadProfile = async () => {
    try {
      // Avoid type issues by using any
      const result: any = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username || "")
        .maybeSingle();

      const profileData = result.data;
      const error = result.error;

      if (error || !profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Load sections from my_page_sections table
      const sectionsResult: any = await supabase
        .from("my_page_sections")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_enabled", true)
        .order("display_order");
      
      if (sectionsResult.data) {
        setSections(sectionsResult.data as MyPageSection[]);
      }

      // Load voice certification status
      // @ts-ignore - Avoid type issues with Supabase
      const voiceResult: any = await supabase
        .from("creator_voice_profiles")
        .select("id")
        .eq("creator_id", profileData.id)
        .eq("is_certified", true)
        .maybeSingle();

      setHasVoiceCertification(!!voiceResult.data);

      // Load theme from v2 or construct from v1 data
      const themeData = profileData.my_page_v2_theme;
      if (themeData) {
        setTheme(themeData);
      } else {
        // Map v1 profile data to v2 theme
        const displayName = profileData.account_full_name || profileData.full_name || "";
        const avatar = profileData.account_avatar_url || profileData.avatar_url || null;
        
        setTheme({
          ...defaultTheme,
          displayName,
          username: profileData.username,
          bio: profileData.bio || "",
          profileImage: avatar,
          backgroundColor: profileData.page_background_color || "#ffffff",
          themeColor: profileData.theme_color || "#3b82f6",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If no valid username, redirect to home
  if (!hasValidUsername) {
    return <Navigate to="/" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">This creator page doesn't exist.</p>
        </Card>
      </div>
    );
  }

  const bgStyle =
    theme.backgroundType === "solid"
      ? { backgroundColor: theme.backgroundColor }
      : theme.backgroundType === "gradient"
      ? {
          backgroundImage: `linear-gradient(${theme.backgroundGradient?.direction || "to bottom right"}, ${theme.backgroundGradient?.from || "#ffffff"}, ${theme.backgroundGradient?.to || "#f3f4f6"})`,
        }
      : theme.backgroundType === "image" && theme.backgroundImage
      ? { backgroundImage: `url(${theme.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
      : undefined;

  const cardClasses = cn(
    "transition-all duration-300 hover:shadow-lg",
    theme.cardStyle === "round" && "rounded-3xl",
    theme.cardStyle === "square" && "rounded-lg",
    theme.cardStyle === "shadow" && "rounded-2xl shadow-xl",
    theme.cardStyle === "glass" && "rounded-2xl backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border border-white/20"
  );

  const imageClasses = cn(
    "w-32 h-32 object-cover ring-4 ring-white/50 mx-auto",
    theme.imageStyle === "circular" && "rounded-full",
    theme.imageStyle === "square" && "rounded-2xl",
    theme.imageStyle === "portrait" && "rounded-3xl h-40"
  );

  const enabledSections = theme.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const ogImageUrl = `https://seeksy.io/api/og/${profile.username}`;
  const pageUrl = `https://seeksy.io/${profile.username}`;
  const pageTitle = `${theme.displayName || profile.username} | Seeksy`;
  const pageDescription = theme.bio || `Check out ${theme.displayName || profile.username}'s creator page on Seeksy`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={ogImageUrl} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen py-12 px-4" style={bgStyle}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            {theme.profileImage ? (
              <img
                src={theme.profileImage}
                alt={theme.displayName}
                className={imageClasses}
              />
            ) : (
              <div className={cn(imageClasses, "bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center")}>
                <span className="text-4xl text-muted-foreground">{theme.displayName?.[0] || "?"}</span>
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: theme.titleColor }}>
                {theme.displayName || "Your Name"}
              </h1>
              {theme.username && <p className="text-muted-foreground">@{theme.username}</p>}
            </div>

            {/* Voice Badge */}
            {hasVoiceCertification && (
              <div className="flex justify-center">
                <Link to={`/v/${profile.username}/voice-credential`} target="_blank">
                  <VoiceCertifiedBadge size="md" className="cursor-pointer hover:scale-105 transition-transform" />
                </Link>
              </div>
            )}

            {theme.bio && (
              <p className="text-center max-w-md mx-auto" style={{ color: theme.bioColor }}>
                {theme.bio}
              </p>
            )}
          </div>

          {/* New Sections System */}
          <PublicSectionRenderer sections={sections} username={profile.username} />
        </div>
      </div>
    </>
  );
}
