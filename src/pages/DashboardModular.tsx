import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavCustomizationModal } from "@/components/dashboard/NavCustomizationModal";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Users, 
  Play, 
  DollarSign,
  ArrowRight,
  BarChart3,
  Settings2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * DASHBOARD - High-Level Performance Snapshot
 * 
 * Purpose: "How is my channel/business doing overall?"
 * Content: Key metrics, trends, KPIs, rolling stats
 * 
 * This is distinct from:
 * - My Day (today's tasks/meetings)
 * - Creator Hub (tools & opportunities)
 */

interface DashboardStats {
  clips: number;
  mediaFiles: number;
  episodes: number;
  followers: number;
  totalViews: number;
  revenue: number;
}

export default function DashboardModular() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    clips: 0,
    mediaFiles: 0,
    episodes: 0,
    followers: 0,
    totalViews: 0,
    revenue: 0,
  });
  const [navModalOpen, setNavModalOpen] = useState(false);

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
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_full_name")
      .eq("id", user.id)
      .single();

    if (profile?.account_full_name) {
      setFirstName(profile.account_full_name.split(" ")[0]);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { count: clipsCount } = await supabase
        .from("clips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: mediaCount } = await supabase
        .from("media_files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: podcasts } = await supabase
        .from("podcasts")
        .select("id")
        .eq("user_id", user.id);
      
      let episodesCount = 0;
      if (podcasts?.length) {
        const { count } = await supabase
          .from("episodes")
          .select("*", { count: "exact", head: true })
          .in("podcast_id", podcasts.map(p => p.id));
        episodesCount = count || 0;
      }

      setStats({
        clips: clipsCount || 0,
        mediaFiles: mediaCount || 0,
        episodes: episodesCount,
        followers: 0,
        totalViews: 0,
        revenue: 0,
      });
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Key metrics and trends across your Seeksy tools.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setNavModalOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.followers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total followers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Play className="h-4 w-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.episodes + stats.clips}</p>
              <p className="text-xs text-muted-foreground">{stats.episodes} episodes, {stats.clips} clips</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${stats.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Content Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Performance charts coming soon</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Audience Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Growth trends coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-links */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Want to take action?</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my-day">
                    View My Day <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/creator-hub">
                    Open Creator Hub <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NavCustomizationModal
        open={navModalOpen}
        onOpenChange={setNavModalOpen}
      />
    </div>
  );
}
