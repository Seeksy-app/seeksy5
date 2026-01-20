import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Settings,
  Eye,
  BarChart3,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useMyPageEnabled } from "@/hooks/useMyPageEnabled";
import { DashboardCustomizer, WidgetConfig } from "@/components/dashboard/DashboardCustomizer";
import { DailyBriefButton } from "@/components/daily-brief/DailyBriefButton";
import {
  ProfileViewsWidget,
  LinkClicksWidget,
  EngagementWidget,
  EventsWidget,
  MeetingsWidget,
  PollsWidget,
  PodcastsWidget,
  RevenueWidget,
  MediaWidget,
  EmailsSentWidget,
  EmailsOpenedWidget,
  EmailClicksWidget,
  SignupSheetsWidget,
  ClicksByTypeWidget,
  TopLinksWidget,
  QuickActionsWidget,
  StreamAnalyticsWidget,
} from "@/components/dashboard/widgets";
import { SocialAccountsBanner } from "@/components/creator/SocialAccountsBanner";
import { SocialMediaAnalytics } from "@/components/dashboard/widgets/SocialMediaAnalytics";
import { IdentityStatusCard } from "@/components/dashboard/IdentityStatusCard";
import { CertifiedClipsCard } from "@/components/dashboard/CertifiedClipsCard";
import { MediaVaultCard } from "@/components/dashboard/MediaVaultCard";
import { AdvertiserAccessCard } from "@/components/dashboard/AdvertiserAccessCard";
import { QuickCreateCard } from "@/components/dashboard/QuickCreateCard";
import { QuickActionsRow } from "@/components/dashboard/QuickActionsRow";
import { RecommendedSeeksiesBanner } from "@/components/dashboard/RecommendedSeeeksiesBanner";
import { HolidayCreatorBanner } from "@/components/dashboard/HolidayCreatorBanner";
import { SparkGuidanceCard } from "@/components/dashboard/SparkGuidanceCard";
import { FirstActionCTA } from "@/components/dashboard/FirstActionCTA";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";
import { useRole } from "@/contexts/RoleContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MyDayEmptyState } from "@/components/myday/MyDayEmptyState";
import { GoogleConnectBanner } from "@/components/dashboard/GoogleConnectBanner";

interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  totalMeetings: number;
  upcomingMeetings: number;
  totalSignupSheets: number;
  totalPolls: number;
  publishedPolls: number;
  totalEmailsSent: number;
  profileViews: number;
  linkClicks: number;
  profileViewsThisWeek: number;
  linkClicksThisWeek: number;
  totalPodcasts: number;
  totalEpisodes: number;
  totalRevenue: number;
  totalImpressions: number;
  mediaFiles: number;
  engagementRate: number;
}

interface LinkClickBreakdown {
  link_type: string;
  count: number;
  title?: string;
}

interface TopLink {
  link_url: string;
  link_type: string;
  count: number;
}

interface TrackingStats {
  opens: number;
  clicks: number;
  total: number;
}

/**
 * Widget to module mapping - which modules are required for each widget
 * CRITICAL: Every widget must have at least one required module
 */
const WIDGET_MODULE_MAP: Record<string, string[]> = {
  "profile-views": ["my-page", "mypage"],
  "link-clicks": ["my-page", "mypage"],
  "engagement": ["my-page", "mypage"],
  "stream-analytics": ["my-page", "mypage", "streaming"],
  "clicks-by-type": ["my-page", "mypage"],
  "top-links": ["my-page", "mypage"],
  "social-media": ["social-media", "social-analytics"],
  "emails-sent": ["email", "newsletter", "email-signatures", "email-client"],
  "emails-opened": ["email", "newsletter", "email-signatures", "email-client"],
  "email-clicks": ["email", "newsletter", "email-signatures", "email-client"],
  "events": ["events"],
  "meetings": ["meetings"],
  "polls": ["polls"],
  "signup-sheets": ["signup-sheets"],
  "quick-actions": ["studio", "podcasts", "meetings", "media-library"], // Requires at least one
  "podcasts": ["podcasts", "podcast-hosting"],
  "media": ["media-library", "studio"],
  "revenue": ["monetization", "advertising"],
  "impressions": ["monetization", "advertising"],
};

/**
 * Feature cards to module mapping
 * CRITICAL: Every card must have at least one required module - NO empty arrays
 */
const FEATURE_CARD_MODULE_MAP: Record<string, string[]> = {
  "identity": ["identity-verification", "identity"],
  "clips": ["ai-clips", "clips"],
  "media": ["media-library", "studio"],
  "advertiser": ["monetization", "advertising"],
  "quick-create": ["studio", "podcasts", "media-library"], // Requires at least one creator module
  "book-mia": ["meetings"],
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "profile-views", label: "Profile Visits", enabled: true, category: "mypage" },
  { id: "link-clicks", label: "Link Clicks", enabled: true, category: "mypage" },
  { id: "engagement", label: "Engagement Rate", enabled: true, category: "mypage" },
  { id: "stream-analytics", label: "My Page Streaming", enabled: true, category: "mypage" },
  { id: "clicks-by-type", label: "Clicks by Type", enabled: true, category: "mypage" },
  { id: "top-links", label: "Top Performing Links", enabled: true, category: "mypage" },
  { id: "social-media", label: "Social Media Analytics", enabled: true, category: "engagement" },
  { id: "emails-sent", label: "Emails Sent", enabled: true, category: "email" },
  { id: "emails-opened", label: "Emails Opened", enabled: true, category: "email" },
  { id: "email-clicks", label: "Email Link Clicks", enabled: true, category: "email" },
  { id: "events", label: "Events Created", enabled: true, category: "seekies" },
  { id: "meetings", label: "Meetings Scheduled", enabled: true, category: "seekies" },
  { id: "polls", label: "Polls & Voting", enabled: true, category: "seekies" },
  { id: "signup-sheets", label: "Sign-Up Sheets", enabled: true, category: "seekies" },
  { id: "quick-actions", label: "Quick Actions", enabled: true, category: "seekies" },
  { id: "podcasts", label: "Total Podcasts", enabled: true, category: "media" },
  { id: "media", label: "Media Library Files", enabled: true, category: "media" },
  { id: "revenue", label: "Ad Revenue Earnings", enabled: true, category: "revenue" },
  { id: "impressions", label: "Total Ad Impressions", enabled: true, category: "revenue" },
];

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good morning", icon: <Sunrise className="h-6 w-6 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { text: "Good afternoon", icon: <Sun className="h-6 w-6 text-yellow-500" /> };
  if (hour >= 17 && hour < 21) return { text: "Good evening", icon: <Sunset className="h-6 w-6 text-orange-500" /> };
  return { text: "Good night", icon: <Moon className="h-6 w-6 text-indigo-400" /> };
}

export default function MyDay() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clickBreakdown, setClickBreakdown] = useState<LinkClickBreakdown[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({ opens: 0, clicks: 0, total: 0 });
  const { currentWorkspace, workspaceModules } = useWorkspace();
  
  // Get active module IDs from workspace
  const activeModuleIds = useMemo(() => {
    const moduleIds = new Set<string>();
    workspaceModules.forEach(wm => moduleIds.add(wm.module_id.toLowerCase()));
    currentWorkspace?.modules?.forEach(m => moduleIds.add(m.toLowerCase()));
    return moduleIds;
  }, [workspaceModules, currentWorkspace]);

  // Check if a widget should be visible based on active modules
  const isWidgetVisible = (widgetId: string): boolean => {
    const requiredModules = WIDGET_MODULE_MAP[widgetId] || [];
    // CRITICAL: If no required modules defined, widget should NOT show
    if (requiredModules.length === 0) return false;
    return requiredModules.some(modId => 
      activeModuleIds.has(modId) || 
      Array.from(activeModuleIds).some(activeId => 
        activeId.includes(modId) || modId.includes(activeId)
      )
    );
  };

  // Check if a feature card should be visible based on active modules
  const isFeatureCardVisible = (cardId: string): boolean => {
    const requiredModules = FEATURE_CARD_MODULE_MAP[cardId] || [];
    // CRITICAL: If no required modules defined, card should NOT show
    if (requiredModules.length === 0) return false;
    return requiredModules.some(modId => 
      activeModuleIds.has(modId) || 
      Array.from(activeModuleIds).some(activeId => 
        activeId.includes(modId) || modId.includes(activeId)
      )
    );
  };

  // Check if workspace has zero modules
  const hasZeroModules = activeModuleIds.size === 0;

  // Load widgets from localStorage but filter by active modules
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("myday-widgets");
    if (saved) {
      const savedWidgets = JSON.parse(saved);
      return DEFAULT_WIDGETS.map(defaultWidget => {
        const savedWidget = savedWidgets.find((w: WidgetConfig) => w.id === defaultWidget.id);
        return savedWidget || defaultWidget;
      });
    }
    return DEFAULT_WIDGETS;
  });

  // Filter widgets to only show those with active modules
  const visibleWidgets = useMemo(() => {
    return widgets.filter(w => w.enabled && isWidgetVisible(w.id));
  }, [widgets, activeModuleIds]);
  
  const { data: myPageEnabled } = useMyPageEnabled();
  const { currentRole } = useRole();
  const { data: holidaySettings } = useHolidaySettings();
  const greeting = getGreeting();

  const showHolidayBanner = (currentRole === 'creator' || currentRole === 'influencer' || currentRole === 'agency') && 
                             (holidaySettings?.holidayMode || (new Date().getMonth() === 11));

  const handleWidgetsSave = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("myday-widgets", JSON.stringify(newWidgets));
    toast({
      title: "Dashboard customized!",
      description: "Your preferences have been saved.",
      duration: 2000,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadStats();
      loadTrackingStats();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_full_name, account_avatar_url")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      setFirstName(profile.account_full_name.split(" ")[0]);
    }
    if (profile?.account_avatar_url) {
      setAvatarUrl(profile.account_avatar_url);
    }
  };

  const loadTrackingStats = async () => {
    if (!user) return;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from("signature_tracking_events")
        .select("event_type")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      if (data) {
        const opens = data.filter(e => e.event_type === "open").length;
        const clicks = data.filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type)).length;
        setTrackingStats({ opens, clicks, total: opens + clicks });
      }
    } catch (error) {
      console.error("Error loading tracking stats:", error);
    }
  };

  const loadStats = async () => {
    try {
      if (!user) return;
      setLoading(true);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const profileId = profileData?.id || user.id;

      const [
        { count: totalEvents },
        { count: publishedEvents },
        { count: totalMeetings },
        { count: upcomingMeetings },
        { count: totalSignupSheets },
        { count: totalPolls },
        { count: publishedPolls },
        { count: totalEmailsSent },
        { count: profileViews },
        { count: linkClicks },
        { count: profileViewsThisWeek },
        { count: linkClicksThisWeek },
        { count: totalPodcasts },
        { count: totalEpisodes },
        { count: mediaFiles },
      ] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("meetings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("meetings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("start_time", now.toISOString()),
        supabase.from("signup_sheets").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("polls").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true),
        supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", profileId),
        supabase.from("profile_views").select("*", { count: "exact", head: true }).eq("profile_id", profileId).gte("viewed_at", weekAgo.toISOString()),
        supabase.from("link_clicks").select("*", { count: "exact", head: true }).eq("profile_id", profileId).gte("clicked_at", weekAgo.toISOString()),
        supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("episodes").select("podcast_id", { count: "exact", head: true }).in("podcast_id", 
          (await supabase.from("podcasts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || []
        ),
        supabase.from("media_files").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("creator_share, total_impressions")
        .eq("user_id", user.id);
      
      const totalRevenue = earnings?.reduce((sum, e) => sum + (e.creator_share || 0), 0) || 0;
      const totalImpressions = earnings?.reduce((sum, e) => sum + (e.total_impressions || 0), 0) || 0;

      const engagementRate = profileViews && profileViews > 0 
        ? ((linkClicks || 0) / profileViews) * 100 
        : 0;

      setStats({
        totalEvents: totalEvents || 0,
        publishedEvents: publishedEvents || 0,
        totalMeetings: totalMeetings || 0,
        upcomingMeetings: upcomingMeetings || 0,
        totalSignupSheets: totalSignupSheets || 0,
        totalPolls: totalPolls || 0,
        publishedPolls: publishedPolls || 0,
        totalEmailsSent: totalEmailsSent || 0,
        profileViews: profileViews || 0,
        linkClicks: linkClicks || 0,
        profileViewsThisWeek: profileViewsThisWeek || 0,
        linkClicksThisWeek: linkClicksThisWeek || 0,
        totalPodcasts: totalPodcasts || 0,
        totalEpisodes: totalEpisodes || 0,
        totalRevenue,
        totalImpressions,
        mediaFiles: mediaFiles || 0,
        engagementRate,
      });

      // Load click breakdown
      const { data: breakdown } = await supabase
        .from("link_clicks")
        .select("link_type, link_url")
        .eq("profile_id", profileId);

      if (breakdown) {
        const typeCounts = breakdown.reduce((acc: Record<string, number>, click) => {
          if (click.link_type !== 'custom_link') {
            acc[click.link_type] = (acc[click.link_type] || 0) + 1;
          }
          return acc;
        }, {});

        const customClicks = breakdown.filter(c => c.link_type === 'custom_link');
        const customUrlCounts = customClicks.reduce((acc: Record<string, number>, click) => {
          acc[click.link_url] = (acc[click.link_url] || 0) + 1;
          return acc;
        }, {});

        const { data: customLinks } = await supabase
          .from('custom_links')
          .select('url, title')
          .eq('profile_id', profileId);

        const regularBreakdown = Object.entries(typeCounts)
          .map(([link_type, count]) => ({ link_type, count: count as number }));

        const customBreakdown = Object.entries(customUrlCounts).map(([url, count]) => {
          const link = customLinks?.find(l => l.url === url);
          return {
            link_type: 'custom_link',
            title: link?.title || url,
            count: count as number,
          };
        });

        setClickBreakdown(
          [...regularBreakdown, ...customBreakdown].sort((a, b) => b.count - a.count)
        );
      }

      // Load top links
      const { data: links } = await supabase
        .from("link_clicks")
        .select("link_url, link_type")
        .eq("profile_id", profileId);

      if (links) {
        const linkCounts = links.reduce((acc: Record<string, { type: string; count: number }>, click) => {
          const key = click.link_url;
          if (!acc[key]) {
            acc[key] = { type: click.link_type, count: 0 };
          }
          acc[key].count++;
          return acc;
        }, {});

        setTopLinks(
          Object.entries(linkCounts)
            .map(([link_url, data]) => ({ link_url, link_type: data.type, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // CRITICAL HARD GUARD: If zero modules installed, show ONLY empty state
  if (hasZeroModules) {
    return (
      <div className="min-h-screen bg-background">
        <main className="px-6 lg:px-10 pt-8 pb-16 flex flex-col items-start w-full">
          {/* Minimal header for empty state */}
          <div className="w-full mb-8 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt={firstName} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  {greeting.icon}
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                    {greeting.text}{firstName ? `, ${firstName}` : ""}!
                  </h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Let's set up your workspace.
                </p>
              </div>
            </div>
          </div>

          {/* ONLY show empty state - nothing else */}
          <MyDayEmptyState onAddSeeksy={() => navigate('/apps?view=modules')} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 lg:px-10 pt-8 pb-16 flex flex-col items-start w-full">
        {/* My Day Header with Avatar, Greeting, and Action Buttons */}
        <div className="w-full mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={firstName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                {greeting.icon}
                <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                  {greeting.text}{firstName ? `, ${firstName}` : ""}!
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Here's what's happening across your shows, campaigns, and events today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DailyBriefButton audienceType="creator" variant="outline" />
            <DashboardCustomizer widgets={widgets} onSave={handleWidgetsSave} />
            {isFeatureCardVisible("book-mia") && (
              <Button variant="outline" size="sm" onClick={() => navigate("/meetings/create")}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            )}
            {trackingStats.total > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/signatures")}
                className="relative"
              >
                <Eye className="h-4 w-4 mr-2" />
                Tracking
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 min-w-[20px] px-1.5 text-xs bg-primary"
                >
                  {trackingStats.total}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Spark Micro-Guidance Card - for new users */}
        <SparkGuidanceCard firstName={firstName} modulesCount={activeModuleIds.size} />

        {/* First Action CTA - prominent entry point */}
        <FirstActionCTA hasModules={activeModuleIds.size > 0} />

        {/* Google Connect Banner - optional post-onboarding prompt */}
        <GoogleConnectBanner />

        {/* Social Accounts Banner */}
        <SocialAccountsBanner />

        {/* Holiday Banner */}
        {showHolidayBanner && (
          <HolidayCreatorBanner firstName={firstName} />
        )}

        {/* Recommended Seeksies - reworded copy */}
        <RecommendedSeeksiesBanner />

        {/* Quick Actions Row - only renders if modules installed */}
        <QuickActionsRow />

        {/* Identity & Content Dashboard Cards - filtered by module */}
        {/* Only render grid if at least one card is visible */}
        {(isFeatureCardVisible("identity") || isFeatureCardVisible("clips") || isFeatureCardVisible("media") || isFeatureCardVisible("advertiser") || isFeatureCardVisible("quick-create")) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8 w-full">
            {isFeatureCardVisible("identity") && <IdentityStatusCard />}
            {isFeatureCardVisible("clips") && <CertifiedClipsCard />}
            {isFeatureCardVisible("media") && <MediaVaultCard />}
            {isFeatureCardVisible("advertiser") && <AdvertiserAccessCard />}
            {isFeatureCardVisible("quick-create") && <QuickCreateCard />}
          </div>
        )}

        {/* Customizable Widgets */}
        {stats && (
          <div className="space-y-6 mb-8 w-full">
            {/* MY PAGE SECTION - only show if myPage is enabled AND widgets are visible */}
            {myPageEnabled && visibleWidgets.some(w => ['profile-views', 'link-clicks', 'engagement', 'stream-analytics'].includes(w.id)) && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleWidgets.filter(w => ['profile-views', 'link-clicks', 'engagement', 'stream-analytics'].includes(w.id)).map(widget => {
                    switch (widget.id) {
                      case "profile-views":
                        return <ProfileViewsWidget key={widget.id} data={stats} />;
                      case "link-clicks":
                        return <LinkClicksWidget key={widget.id} data={stats} />;
                      case "engagement":
                        return <EngagementWidget key={widget.id} data={stats} />;
                      case "stream-analytics":
                        return <StreamAnalyticsWidget key={widget.id} />;
                      default:
                        return null;
                    }
                  })}
                </div>

                {stats.linkClicks > 0 && visibleWidgets.some(w => ['clicks-by-type', 'top-links'].includes(w.id)) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {visibleWidgets.find(w => w.id === 'clicks-by-type') && (
                      <ClicksByTypeWidget clickBreakdown={clickBreakdown} totalClicks={stats.linkClicks} />
                    )}
                    {visibleWidgets.find(w => w.id === 'top-links') && (
                      <TopLinksWidget topLinks={topLinks} />
                    )}
                  </div>
                )}

                {visibleWidgets.find(w => w.id === 'social-media') && (
                  <div>
                    <SocialMediaAnalytics />
                  </div>
                )}
              </div>
            )}

            {/* EMAIL ANALYTICS SECTION */}
            {visibleWidgets.some(w => ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleWidgets.filter(w => ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "emails-sent":
                      return <EmailsSentWidget key={widget.id} />;
                    case "emails-opened":
                      return <EmailsOpenedWidget key={widget.id} />;
                    case "email-clicks":
                      return <EmailClicksWidget key={widget.id} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* SEEKIES & CONTENT SECTION */}
            {visibleWidgets.some(w => ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleWidgets.filter(w => ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "events":
                      return <EventsWidget key={widget.id} data={stats} />;
                    case "meetings":
                      return <MeetingsWidget key={widget.id} data={stats} />;
                    case "polls":
                      return <PollsWidget key={widget.id} data={stats} />;
                    case "signup-sheets":
                      return <SignupSheetsWidget key={widget.id} data={stats} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* MEDIA & PODCASTS SECTION */}
            {visibleWidgets.some(w => ['podcasts', 'media'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleWidgets.filter(w => ['podcasts', 'media'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "podcasts":
                      return <PodcastsWidget key={widget.id} data={stats} />;
                    case "media":
                      return <MediaWidget key={widget.id} data={stats} />;
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* REVENUE SECTION */}
            {visibleWidgets.some(w => ['revenue', 'impressions'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleWidgets.filter(w => ['revenue', 'impressions'].includes(w.id)).map(widget => {
                  switch (widget.id) {
                    case "revenue":
                      return <RevenueWidget key={widget.id} data={stats} />;
                    case "impressions":
                      return (
                        <div key={widget.id} className="cursor-pointer" onClick={() => navigate("/podcast-revenue")}>
                          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Total Ad Impressions</h3>
                              <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <div className="text-3xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
                              <p className="text-xs text-muted-foreground">Across all campaigns</p>
                            </div>
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            )}

            {/* Note: Quick Actions removed from widgets section - now appears once at top via QuickActionsRow */}
          </div>
        )}
      </main>
    </div>
  );
}
