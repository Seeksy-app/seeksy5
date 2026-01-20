import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { SetupChecklist } from "./SetupChecklist";
import { KPIRow } from "./KPIRow";
import { ModuleWidget } from "./ModuleWidget";
import { getDashboardConfig, type UserType } from "@/config/dashboardConfig";
import { toast } from "sonner";

interface AdaptiveDashboardProps {
  userId: string;
  userName?: string;
}

export function AdaptiveDashboard({ userId, userName }: AdaptiveDashboardProps) {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("creator");
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [kpiData, setKpiData] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(true);
  const [activatedModules, setActivatedModules] = useState<string[]>([]);

  useEffect(() => {
    loadUserPreferences();
    loadKPIData();
  }, [userId]);

  const loadUserPreferences = async () => {
    try {
      // Get user type from preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("user_type, onboarding_completed, my_page_enabled, pinned_modules")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs?.user_type) {
        setUserType(prefs.user_type as UserType);
      }

      // Load activated modules from localStorage or DB
      const storedModules = localStorage.getItem("activated_modules");
      if (storedModules) {
        setActivatedModules(JSON.parse(storedModules));
      } else if (prefs?.pinned_modules && Array.isArray(prefs.pinned_modules)) {
        setActivatedModules(prefs.pinned_modules.map(m => String(m)));
      }

      // Determine completed checklist items
      const completed: string[] = [];

      // Check social connection
      const { count: socialCount } = await supabase
        .from("social_media_profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (socialCount && socialCount > 0) {
        completed.push("connect-social", "connect-social-biz", "connect-creator-social");
      }

      // Check if data was synced (simplified check)
      // The social_insights_snapshots table may not exist, so we skip this check
      // completed.push("sync-data", "sync-analytics") will be added when social is connected

      // Check My Page
      if (prefs?.my_page_enabled) {
        completed.push("setup-mypage", "build-page");
      }

      // Check media uploaded
      const { count: mediaCount } = await supabase
        .from("media_files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (mediaCount && mediaCount > 0) {
        completed.push("upload-media");
      }

      // Check podcasts
      const { count: podcastCount } = await supabase
        .from("podcasts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (podcastCount && podcastCount > 0) {
        completed.push("connect-podcast", "add-episode");
      }

      // Check contacts imported
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (contactCount && contactCount > 0) {
        completed.push("import-contacts");
      }

      // Check segments
      const { count: segmentCount } = await supabase
        .from("segments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (segmentCount && segmentCount > 0) {
        completed.push("create-segment");
      }

      // Check events
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (eventCount && eventCount > 0) {
        completed.push("add-event", "setup-template");
      }

      // Check campaigns
      const { count: campaignCount } = await supabase
        .from("email_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (campaignCount && campaignCount > 0) {
        completed.push("publish-campaign");
      }

      // Check proposals
      const { count: proposalCount } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (proposalCount && proposalCount > 0) {
        completed.push("build-proposal");
      }

      setCompletedItems(completed);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadKPIData = async () => {
    try {
      setLoading(true);

      // Load various KPI data
      const [
        { count: contacts },
        { count: podcasts },
        { data: earnings },
        { data: socialProfile },
      ] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("creator_earnings").select("creator_share, total_impressions").eq("user_id", userId),
        supabase.from("social_media_profiles").select("followers_count").eq("user_id", userId).maybeSingle(),
      ]);

      const totalRevenue = earnings?.reduce((sum, e) => sum + (e.creator_share || 0), 0) || 0;
      const followersCount = socialProfile?.followers_count || 0;

      setKpiData({
        totalFollowers: followersCount,
        engagementRate: 3.2, // Default engagement rate
        totalReach: followersCount * 3,
        estimatedValue: totalRevenue || 0,
        totalDownloads: 0,
        avgDownloads: 0,
        topLocation: "US",
        retention: 65,
        totalContacts: contacts || 0,
        campaignEngagement: 24.5,
        websiteTraffic: 0,
        leadConversions: 0,
        totalRegistrations: 0,
        attendanceRate: 0,
        marketingConversions: 0,
        creatorPerformance: 0,
        totalReachAgency: 0,
        activeDeals: 0,
      });
    } catch (error) {
      console.error("Error loading KPI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const config = getDashboardConfig(userType);
  
  // Filter widgets based on activated modules
  const activeWidgets = config.widgets.filter(widget => {
    if (!widget.moduleId) return true;
    return activatedModules.includes(widget.moduleId);
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {greeting()}, {userName || "there"}!
            <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-muted-foreground">{config.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/apps?view=modules")}>
          <Settings2 className="h-4 w-4 mr-2" />
          Customize Apps
        </Button>
      </motion.div>

      {/* Setup Checklist */}
      <SetupChecklist 
        items={config.checklist} 
        completedItems={completedItems}
        onDismiss={() => {
          toast.success("Checklist hidden. You can always find it in Settings.");
        }}
      />

      {/* KPI Row */}
      <KPIRow kpis={config.kpis} data={kpiData} />

      {/* Module Widgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Tools</h2>
          <Badge variant="secondary" className="text-xs">
            {activeWidgets.length} active
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeWidgets.map((widget, index) => (
            <ModuleWidget key={widget.id} widget={widget} index={index} />
          ))}
        </div>
      </div>

      {/* Recommended Actions (AI placeholder) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Recommended for you</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {userType === "creator" && "Connect your Instagram to unlock audience insights and brand deal opportunities."}
          {userType === "podcaster" && "Upload your first episode to start tracking downloads and listener analytics."}
          {userType === "business" && "Import your contact list to begin segmenting and running targeted campaigns."}
          {userType === "event_host" && "Create your first event template to streamline your booking process."}
          {userType === "agency" && "Add creators to your workspace to start managing their presence."}
        </p>
      </motion.div>
    </div>
  );
}
