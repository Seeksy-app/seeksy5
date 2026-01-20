import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Users as UsersIcon } from "lucide-react";

interface SubscriptionsAdminProps {
  demoMode?: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  profiles: {
    username: string;
    full_name: string | null;
  } | null;
}

interface UsageData {
  user_id: string;
  ai_messages: number;
  podcast_storage_mb: number;
}

const PLAN_LIMITS: Record<string, { ai_messages: number; podcast_storage_gb: number }> = {
  free: { ai_messages: 50, podcast_storage_gb: 1 },
  creator_pro: { ai_messages: 500, podcast_storage_gb: 10 },
  creator_business: { ai_messages: 2000, podcast_storage_gb: 50 },
};

export default function SubscriptionsAdmin({ demoMode = false }: SubscriptionsAdminProps) {
  // Generate demo data if demo mode is enabled
  const demoSubscriptions: Subscription[] = demoMode ? [
    {
      id: "demo-1",
      user_id: "demo-user-1",
      plan_name: "creator_business",
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: { username: "JohnnyRocket", full_name: "Johnny Rocket" }
    },
    {
      id: "demo-2",
      user_id: "demo-user-2",
      plan_name: "creator_pro",
      status: "active",
      current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: { username: "SarahCreates", full_name: "Sarah Creates" }
    },
    {
      id: "demo-3",
      user_id: "demo-user-3",
      plan_name: "creator_pro",
      status: "active",
      current_period_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: { username: "MikeMedia", full_name: "Mike Media" }
    }
  ] : [];

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions", demoMode],
    queryFn: async () => {
      if (demoMode) return demoSubscriptions;
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (subError) throw subError;
      if (!subData) return [];

      // Fetch profiles separately
      const userIds = subData.map(sub => sub.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);
      
      if (profilesError) throw profilesError;

      // Merge subscriptions with profiles
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      return subData.map(sub => ({
        ...sub,
        profiles: profilesMap.get(sub.user_id) || null
      })) as Subscription[];
    },
  });

  const { data: usageData = [] } = useQuery({
    queryKey: ["admin-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usage_tracking")
        .select("user_id, feature_type, usage_count")
        .gte("period_end", new Date().toISOString())
        .lte("period_start", new Date().toISOString());
      
      if (error) throw error;

      // Group by user_id
      const grouped: Record<string, UsageData> = {};
      data.forEach((item) => {
        if (!grouped[item.user_id]) {
          grouped[item.user_id] = { user_id: item.user_id, ai_messages: 0, podcast_storage_mb: 0 };
        }
        if (item.feature_type === "ai_messages") {
          grouped[item.user_id].ai_messages = item.usage_count;
        } else if (item.feature_type === "podcast_storage_mb") {
          grouped[item.user_id].podcast_storage_mb = item.usage_count;
        }
      });

      return Object.values(grouped);
    },
  });

  const getUsageForUser = (userId: string) => {
    return usageData.find(u => u.user_id === userId) || { ai_messages: 0, podcast_storage_mb: 0 };
  };

  const getPlanBadgeColor = (planName: string) => {
    switch (planName) {
      case "creator_business":
        return "bg-purple-500 hover:bg-purple-600";
      case "creator_pro":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  const totalRevenue = subscriptions
    .filter(sub => sub.plan_name !== "free" && sub.status === "active")
    .reduce((sum, sub) => {
      const price = sub.plan_name === "creator_pro" ? 29 : sub.plan_name === "creator_business" ? 79 : 0;
      return sum + price;
    }, 0);

  const planCounts = subscriptions.reduce((acc, sub) => {
    acc[sub.plan_name] = (acc[sub.plan_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-bold">${totalRevenue}</div>
          <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Pro Users</span>
          </div>
          <div className="text-2xl font-bold">{planCounts.creator_pro || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Creator Pro subscribers</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Business Users</span>
          </div>
          <div className="text-2xl font-bold">{planCounts.creator_business || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Creator Business subscribers</p>
        </div>
      </div>

      {/* User Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((sub) => {
          const usage = getUsageForUser(sub.user_id);
          const limits = PLAN_LIMITS[sub.plan_name];
          const aiUsagePercent = limits ? (usage.ai_messages / limits.ai_messages) * 100 : 0;
          const storageUsagePercent = limits ? (usage.podcast_storage_mb / (limits.podcast_storage_gb * 1024)) * 100 : 0;

          return (
            <div key={sub.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">
                      {sub.profiles?.full_name || sub.profiles?.username || "Unknown User"}
                    </h4>
                    {sub.profiles?.username && (
                      <span className="text-sm text-muted-foreground">@{sub.profiles.username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlanBadgeColor(sub.plan_name)}>
                      {sub.plan_name === "creator_pro" ? "Creator Pro" : 
                       sub.plan_name === "creator_business" ? "Creator Business" : "Free"}
                    </Badge>
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
                {sub.current_period_end && (
                  <div className="text-sm text-muted-foreground">
                    Renews {new Date(sub.current_period_end).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Usage Meters */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>AI Messages</span>
                    <span className={`${
                      aiUsagePercent >= 90 ? "text-destructive font-semibold" : 
                      aiUsagePercent >= 80 ? "text-accent font-medium" : 
                      "text-muted-foreground"
                    }`}>
                      {usage.ai_messages} / {limits.ai_messages}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(aiUsagePercent, 100)} 
                    className={`h-2 ${
                      aiUsagePercent >= 90 ? "[&>div]:bg-destructive" :
                      aiUsagePercent >= 80 ? "[&>div]:bg-accent" : ""
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Storage</span>
                    <span className={`${
                      storageUsagePercent >= 90 ? "text-destructive font-semibold" : 
                      storageUsagePercent >= 80 ? "text-accent font-medium" : 
                      "text-muted-foreground"
                    }`}>
                      {(usage.podcast_storage_mb / 1024).toFixed(2)} / {limits.podcast_storage_gb} GB
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(storageUsagePercent, 100)} 
                    className={`h-2 ${
                      storageUsagePercent >= 90 ? "[&>div]:bg-destructive" :
                      storageUsagePercent >= 80 ? "[&>div]:bg-accent" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {subscriptions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No subscriptions found
          </div>
        )}
      </div>
    </div>
  );
}
