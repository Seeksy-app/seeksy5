import { MyPageTheme } from "@/config/myPageThemes";
import { cn } from "@/lib/utils";
import { VoiceCertifiedBadge } from "@/components/VoiceCertifiedBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Calendar, Store, Share2, Eye, Link2, ShoppingBag, Gift, BookOpen, Radio, Rss, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MyPageSection, SECTION_TYPE_INFO, SectionType } from "@/lib/mypage/sectionTypes";

interface MyPagePreviewProps {
  theme: MyPageTheme;
  mode: "edit" | "preview";
}

// Map section types to icons
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  featured_video: <Video className="w-5 h-5" />,
  stream_channel: <Video className="w-5 h-5" />,
  social_links: <Share2 className="w-5 h-5" />,
  meetings: <Calendar className="w-5 h-5" />,
  books: <BookOpen className="w-5 h-5" />,
  promo_codes: <Gift className="w-5 h-5" />,
  store: <Store className="w-5 h-5" />,
  tips: <ShoppingBag className="w-5 h-5" />,
  custom_links: <Link2 className="w-5 h-5" />,
  podcast: <Radio className="w-5 h-5" />,
  blog: <Rss className="w-5 h-5" />,
  newsletter: <Mail className="w-5 h-5" />,
};

export function MyPagePreview({ theme, mode }: MyPagePreviewProps) {
  // Fetch sections from database
  const { data: dbSections = [] } = useQuery({
    queryKey: ["my-page-sections-preview"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("my_page_sections")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order");
      
      if (error) {
        console.error("Error fetching sections:", error);
        return [];
      }
      return data as MyPageSection[];
    },
    refetchInterval: 1000, // Poll every second for real-time updates
  });

  const bgClass = theme.backgroundType === "gradient"
    ? `bg-gradient-to-${theme.backgroundGradient?.direction || "br"}`
    : "";

  const bgStyle = theme.backgroundType === "solid"
    ? { backgroundColor: theme.backgroundColor }
    : theme.backgroundType === "gradient"
    ? {
        backgroundImage: `linear-gradient(to ${theme.backgroundGradient?.direction?.replace("to-", "") || "bottom right"}, ${theme.backgroundGradient?.from || "#ffffff"}, ${theme.backgroundGradient?.to || "#f3f4f6"})`
      }
    : theme.backgroundType === "image" && theme.backgroundImage
    ? { backgroundImage: `url(${theme.backgroundImage})`, backgroundSize: "cover" }
    : undefined;

  // Apply font family from theme
  const fontFamily = theme.titleFont || "Inter";
  const containerStyle = {
    ...bgStyle,
    fontFamily: `${fontFamily}, sans-serif`,
  };

  const cardClasses = cn(
    "transition-all duration-300",
    theme.cardStyle === "round" && "rounded-3xl",
    theme.cardStyle === "square" && "rounded-lg",
    theme.cardStyle === "shadow" && "rounded-2xl shadow-xl",
    theme.cardStyle === "glass" && "rounded-2xl backdrop-blur-lg bg-white/80 border border-white/20"
  );

  const imageClasses = cn(
    "w-32 h-32 object-cover ring-4 ring-white/50",
    theme.imageStyle === "circular" && "rounded-full",
    theme.imageStyle === "square" && "rounded-2xl",
    theme.imageStyle === "portrait" && "rounded-3xl h-40"
  );

  // Use database sections - only show enabled ones, sorted by display_order
  const enabledSections = dbSections.filter(s => s.is_enabled);

  return (
    <div
      className={cn("min-h-full py-12 px-4", bgClass)}
      style={containerStyle}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          {theme.profileImage ? (
            <img
              src={theme.profileImage}
              alt={theme.displayName}
              className={cn(imageClasses, "mx-auto")}
            />
          ) : (
            <div className={cn(imageClasses, "mx-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center")}>
              <span className="text-4xl text-muted-foreground">
                {theme.displayName?.[0] || "?"}
              </span>
            </div>
          )}

          <div>
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: theme.titleColor }}
            >
              {theme.displayName || "Your Name"}
            </h1>
            {theme.username && (
              <p className="text-muted-foreground">@{theme.username}</p>
            )}
          </div>

          {/* Voice Badge Placeholder */}
          <div className="flex justify-center">
            <VoiceCertifiedBadge size="md" />
          </div>

          {theme.bio && (
            <p
              className="text-center max-w-md mx-auto"
              style={{ color: theme.bioColor }}
            >
              {theme.bio}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {enabledSections.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No sections enabled yet. Enable sections in the builder to see them here.
              </p>
            </Card>
          ) : (
            enabledSections.map((section) => {
              const sectionInfo = SECTION_TYPE_INFO[section.section_type];
              const icon = SECTION_ICONS[section.section_type];

              return (
                <Card key={section.id} className={cn(cardClasses, "p-6")}>
                  {section.section_type === "featured_video" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <div className="relative aspect-video bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl overflow-hidden border border-primary/20 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 flex items-center gap-2 text-white">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-medium">LIVE</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">Your featured video will appear here</p>
                    </div>
                  )}

                  {section.section_type === "stream_channel" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <div className="relative aspect-video bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl overflow-hidden border border-primary/20">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">Your streaming channel will appear here</p>
                    </div>
                  )}

                  {section.section_type === "meetings" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <Button className="w-full">Schedule a Meeting</Button>
                    </div>
                  )}

                  {section.section_type === "social_links" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
                          >
                            <Share2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.section_type === "store" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Connect your store to display products
                      </p>
                    </div>
                  )}

                  {section.section_type === "books" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Showcase your published books
                      </p>
                    </div>
                  )}

                  {section.section_type === "promo_codes" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share your promo codes and offers
                      </p>
                    </div>
                  )}

                  {section.section_type === "tips" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Accept tips from your supporters
                      </p>
                    </div>
                  )}

                  {section.section_type === "custom_links" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add your custom links
                      </p>
                    </div>
                  )}

                  {section.section_type === "podcast" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Display your podcast episodes
                      </p>
                    </div>
                  )}

                  {section.section_type === "blog" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share your blog posts
                      </p>
                    </div>
                  )}

                  {section.section_type === "newsletter" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        {icon}
                        <h3 className="font-semibold">{sectionInfo.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Collect email subscribers
                      </p>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
