import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Clock, Mail, TrendingUp, MousePointerClick, BarChart3, ArrowRight, CalendarDays, Vote, Link as LinkIcon, ExternalLink, Info, Building2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useMyPageEnabled } from "@/hooks/useMyPageEnabled";
import { SpinWheelDialog } from "@/components/credits/SpinWheelDialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import WelcomeModal from "@/components/WelcomeModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DashboardCustomizer, WidgetConfig } from "@/components/dashboard/DashboardCustomizer";
import {
  ProfileViewsWidget,
  LinkClicksWidget,
  EmailsWidget,
  EngagementWidget,
  EventsWidget,
  MeetingsWidget,
  PollsWidget,
  PodcastsWidget,
  RevenueWidget,
  MediaWidget,
  QuickStatsWidget,
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
import alexMorganAvatar from "@/assets/demo-influencer-alex-morgan.jpg";
import { SparkWelcomeModal } from "@/components/spark/SparkWelcomeModal";
import { useRole } from "@/contexts/RoleContext";
import { HolidayCreatorBanner } from "@/components/dashboard/HolidayCreatorBanner";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";
import { IdentityStatusCard } from "@/components/dashboard/IdentityStatusCard";
import { CertifiedClipsCard } from "@/components/dashboard/CertifiedClipsCard";
import { MediaVaultCard } from "@/components/dashboard/MediaVaultCard";
import { AdvertiserAccessCard } from "@/components/dashboard/AdvertiserAccessCard";
import { QuickCreateCard } from "@/components/dashboard/QuickCreateCard";

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
  title?: string; // For custom links
}

interface TopLink {
  link_url: string;
  link_type: string;
  count: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  // My Page & Profile
  { id: "profile-views", label: "Profile Visits", enabled: true, category: "mypage" },
  { id: "link-clicks", label: "Link Clicks", enabled: true, category: "mypage" },
  { id: "engagement", label: "Engagement Rate", enabled: true, category: "mypage" },
  { id: "stream-analytics", label: "My Page Streaming", enabled: true, category: "mypage" },
  { id: "clicks-by-type", label: "Clicks by Type", enabled: true, category: "mypage" },
  { id: "top-links", label: "Top Performing Links", enabled: true, category: "mypage" },
  
  // Engagement & Traffic
  { id: "social-media", label: "Social Media Analytics", enabled: true, category: "engagement" },
  
  // Email Analytics
  { id: "emails-sent", label: "Emails Sent", enabled: true, category: "email" },
  { id: "emails-opened", label: "Emails Opened", enabled: true, category: "email" },
  { id: "email-clicks", label: "Email Link Clicks", enabled: true, category: "email" },
  
  // Seekies & Content
  { id: "events", label: "Events Created", enabled: true, category: "seekies" },
  { id: "meetings", label: "Meetings Scheduled", enabled: true, category: "seekies" },
  { id: "polls", label: "Polls & Voting", enabled: true, category: "seekies" },
  { id: "signup-sheets", label: "Sign-Up Sheets", enabled: true, category: "seekies" },
  { id: "quick-actions", label: "Quick Actions", enabled: true, category: "seekies" },
  { id: "quick-stats", label: "Quick Stats Overview", enabled: false, category: "seekies" },
  
  // Media & Podcasts
  { id: "podcasts", label: "Total Podcasts", enabled: true, category: "media" },
  { id: "media", label: "Media Library Files", enabled: true, category: "media" },
  
  // Revenue
  { id: "revenue", label: "Ad Revenue Earnings", enabled: true, category: "revenue" },
  { id: "impressions", label: "Total Ad Impressions", enabled: true, category: "revenue" },
];

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clickBreakdown, setClickBreakdown] = useState<LinkClickBreakdown[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>("");
  const [advertiserStatus, setAdvertiserStatus] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveStreamTitle, setLiveStreamTitle] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    avatar_url: null as string | null,
    my_page_visited: false,
  });
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      const savedWidgets = JSON.parse(saved);
      // Merge with DEFAULT_WIDGETS to ensure new widgets appear
      const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
        const savedWidget = savedWidgets.find((w: WidgetConfig) => w.id === defaultWidget.id);
        return savedWidget || defaultWidget;
      });
      return mergedWidgets;
    }
    return DEFAULT_WIDGETS;
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: myPageEnabled } = useMyPageEnabled();
  const queryClient = useQueryClient();
  const [showWelcomeSpin, setShowWelcomeSpin] = useState(false);
  const { currentRole } = useRole();
  const [showSparkWelcome, setShowSparkWelcome] = useState(false);
  const { data: holidaySettings } = useHolidaySettings();
  
  // Check if we should show holiday banner (either holidayMode enabled OR naturally in December)
  const showHolidayBanner = (currentRole === 'creator' || currentRole === 'influencer' || currentRole === 'agency') && 
                             (holidaySettings?.holidayMode || (new Date().getMonth() === 11));

  const handleWidgetsSave = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem("dashboard-widgets", JSON.stringify(newWidgets));
    
    const encouragingMessages = [
      { title: "Dashboard customized! 🎨", description: "Your workspace is looking sharp!" },
      { title: "Layout updated! 📊", description: "Dashboard configured just how you like it." },
      { title: "Personalized! ✨", description: "Your dashboard reflects your style." },
      { title: "Nice setup! 🚀", description: "Widget preferences saved successfully." },
    ];
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    
    toast({
      title: randomMessage.title,
      description: randomMessage.description,
      duration: 2000,
    });
  };

  useEffect(() => {
    // Mark that user has visited dashboard (for AI chatbot trigger)
    localStorage.setItem('visited_dashboard', 'true');
    
    // Check if we should show welcome spin
    const shouldShowWelcomeSpin = localStorage.getItem('show_welcome_spin');
    if (shouldShowWelcomeSpin === 'true') {
      // Small delay to let dashboard load
      setTimeout(() => {
        setShowWelcomeSpin(true);
        localStorage.removeItem('show_welcome_spin');
      }, 800);
    }
    
    // Check if we should show Spark welcome modal
    const hasSeenWelcome = localStorage.getItem('spark_welcome_seen');
    if (!hasSeenWelcome && currentRole) {
      setTimeout(() => setShowSparkWelcome(true), 1000);
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkAdvertiserStatus();
      loadStats();
    }
  }, [user]);

  const checkAdvertiserStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("advertisers")
      .select("status")
      .eq("owner_profile_id", user.id)
      .maybeSingle();
    
    if (data) {
      setAdvertiserStatus(data.status);
      // Redirect approved advertisers to their dashboard
      if (data.status === "approved") {
        navigate("/advertiser/dashboard");
      }
    }
  };

  const loadStats = async () => {
    try {
      if (!user) return;
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // First get profile data (account-level for dashboard)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, account_full_name, account_avatar_url, bio, account_phone, is_live_on_profile, live_stream_title")
        .eq("id", user.id)
        .single();
      
      // Set live streaming status
      setIsLiveStreaming(profileData?.is_live_on_profile || false);
      setLiveStreamTitle(profileData?.live_stream_title || null);

      const profileId = profileData?.id || user.id;
      
      // Extract first name and set profile data
      if (profileData?.account_full_name) {
        const nameParts = profileData.account_full_name.split(" ");
        setFirstName(nameParts[0]);
      }

      // Use demo avatar for DemoInfluencer account
      const displayAvatar = profileData?.username === 'DemoInfluencer' 
        ? alexMorganAvatar 
        : profileData?.account_avatar_url || null;

      // For demo account, set dummy phone to bypass profile completion
      const displayPhone = profileData?.username === 'DemoInfluencer' 
        ? '+1234567890' 
        : (profileData?.account_phone || "");

      // Load my_page_visited from user_preferences
      const { data: userPrefs } = await supabase
        .from("user_preferences")
        .select("my_page_visited")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfileData({
        full_name: profileData?.account_full_name || "",
        phone: displayPhone,
        avatar_url: displayAvatar,
        my_page_visited: userPrefs?.my_page_visited || false,
      });

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

      // Get ad revenue
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

      // Get click breakdown by type
      const { data: breakdown } = await supabase
        .from("link_clicks")
        .select("link_type, link_url")
        .eq("profile_id", profileId);

      if (breakdown) {
        const typeCounts = breakdown.reduce((acc: Record<string, number>, click) => {
          // Skip custom_link type in the main breakdown
          if (click.link_type !== 'custom_link') {
            acc[click.link_type] = (acc[click.link_type] || 0) + 1;
          }
          return acc;
        }, {});

        // Get custom links breakdown separately with titles
        const customClicks = breakdown.filter(c => c.link_type === 'custom_link');
        const customUrlCounts = customClicks.reduce((acc: Record<string, number>, click) => {
          acc[click.link_url] = (acc[click.link_url] || 0) + 1;
          return acc;
        }, {});

        // Fetch custom link titles
        const { data: customLinks } = await supabase
          .from('custom_links')
          .select('url, title')
          .eq('profile_id', profileId);

        // Combine regular breakdown with custom links (each with their title)
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

      // Get top clicked links
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
      toast({
        title: "Error loading stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLinkTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'event': 'Events',
      'meeting': 'Meetings',
      'signup': 'Signup Sheets',
      'poll': 'Polls',
      'custom_link': 'Custom Links',
      'social': 'Social Media',
      'podcast': 'Podcasts'
    };
    return labels[type] || type;
  };

  const getLinkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'event': 'bg-blue-500',
      'meeting': 'bg-green-500',
      'signup': 'bg-purple-500',
      'poll': 'bg-orange-500',
      'custom_link': 'bg-pink-500',
      'social': 'bg-cyan-500',
      'podcast': 'bg-indigo-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  if (!user) return null;

  // Show advertiser pending status banner
  if (advertiserStatus === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-20 h-20 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-3xl mb-2">Application Under Review</CardTitle>
                  <CardDescription className="text-base">
                    We're reviewing your advertiser application
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Your application has been submitted successfully. Our team will review it within 1-2 business days.
                  </p>
                  <p className="text-muted-foreground">
                    You'll receive an email once your application has been processed.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold mb-3">What happens next?</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">1</div>
                      <p>Our team reviews your application and business details</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">2</div>
                      <p>You'll receive an approval email with next steps</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">3</div>
                      <p>Set up payment method and create your first campaign</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-5 w-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">4</div>
                      <p>Start reaching podcast audiences with targeted ads</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Return to Homepage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show rejection status
  if (advertiserStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-red-500/50">
              <CardHeader className="text-center">
                <Building2 className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Application Not Approved</CardTitle>
                <CardDescription>
                  Unfortunately, we're unable to approve your advertiser application at this time.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Please contact support if you have questions about this decision.
                </p>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WelcomeModal />
      <main className="px-6 lg:px-10 pt-6 pb-16 flex flex-col items-start w-full">
        {/* Hero Banner */}
        <div className="w-full mb-6 flex items-start justify-between" data-onboarding="dashboard-header">
          <div className="flex items-center gap-5">
            {profileData.avatar_url && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-md opacity-30 scale-110" />
                <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg relative">
                  <AvatarImage src={profileData.avatar_url} alt={profileData.full_name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-500 text-white">
                    {profileData.full_name?.charAt(0) || firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName || 'there'}!
                </span>
              </h1>
              <p className="text-muted-foreground">Here's what's happening across your shows, campaigns, and events today.</p>
            </div>
          </div>
          <div className="flex items-center gap-4" data-onboarding="add-widgets">
            <DashboardCustomizer widgets={widgets} onSave={handleWidgetsSave} />
          </div>
        </div>


        {/* Social Accounts Banner */}
        <SocialAccountsBanner />

        {/* Holiday Banner - Show for creators/influencers/agencies during December */}
        {showHolidayBanner && (
          <HolidayCreatorBanner firstName={firstName} />
        )}

        {/* New Identity & Content Dashboard Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8" data-onboarding="dashboard-widgets">
          <div data-onboarding="identity-widget"><IdentityStatusCard /></div>
          <CertifiedClipsCard />
          <MediaVaultCard />
          <AdvertiserAccessCard />
          <div data-onboarding="quick-actions-row"><QuickCreateCard /></div>
        </div>

        {/* Customizable Widgets */}
        {stats && (
          <div className="space-y-6 mb-8" data-onboarding="performance-stats">
            {/* MY PAGE SECTION - Only show if My Page integration is enabled */}
            {myPageEnabled && (
              <div className="space-y-4">
                {/* Small My Page widgets */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {widgets.filter(w => w.enabled && ['profile-views', 'link-clicks', 'engagement', 'stream-analytics'].includes(w.id)).map(widget => {
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

                {/* Large My Page widgets */}
                {stats.linkClicks > 0 && (widgets.find(w => w.id === 'clicks-by-type' && w.enabled) || widgets.find(w => w.id === 'top-links' && w.enabled)) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {widgets.find(w => w.id === 'clicks-by-type' && w.enabled) && (
                      <ClicksByTypeWidget clickBreakdown={clickBreakdown} totalClicks={stats.linkClicks} />
                    )}
                    {widgets.find(w => w.id === 'top-links' && w.enabled) && (
                      <TopLinksWidget topLinks={topLinks} />
                    )}
                  </div>
                )}

                {/* Social Media Analytics */}
                {widgets.find(w => w.id === 'social-media' && w.enabled) && (
                  <div>
                    <SocialMediaAnalytics />
                  </div>
                )}
              </div>
            )}

            {/* ENGAGEMENT & TRAFFIC SECTION - moved from My Page */}

            {/* EMAIL ANALYTICS SECTION */}
            {widgets.some(w => w.enabled && ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {widgets.filter(w => w.enabled && ['emails-sent', 'emails-opened', 'email-clicks'].includes(w.id)).map(widget => {
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
            {widgets.some(w => w.enabled && ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {widgets.filter(w => w.enabled && ['events', 'meetings', 'polls', 'signup-sheets'].includes(w.id)).map(widget => {
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
            {widgets.some(w => w.enabled && ['podcasts', 'media'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {widgets.filter(w => w.enabled && ['podcasts', 'media'].includes(w.id)).map(widget => {
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
            {widgets.some(w => w.enabled && ['revenue', 'impressions'].includes(w.id)) && (
              <div className="grid gap-4 md:grid-cols-2">
                {widgets.filter(w => w.enabled && ['revenue', 'impressions'].includes(w.id)).map(widget => {
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

            {/* Quick Actions - full width */}
            {widgets.find(w => w.id === 'quick-actions' && w.enabled) && (
              <QuickActionsWidget />
            )}
          </div>
        )}
      </main>

      {/* Welcome Spin Wheel Dialog */}
      <SpinWheelDialog
        open={showWelcomeSpin}
        onOpenChange={setShowWelcomeSpin}
        onSpinComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["user-credits"] });
          setShowWelcomeSpin(false);
        }}
        isWelcomeSpin={true}
      />
      
      {/* Spark Welcome Modal */}
      {currentRole && (
        <SparkWelcomeModal 
          role={currentRole === 'creator' ? 'creator' : currentRole === 'advertiser' ? 'advertiser' : 'guest'}
          onComplete={() => setShowSparkWelcome(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
