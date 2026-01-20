import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, Video, Users, Image, Calendar, TrendingUp } from "lucide-react";

export default function InfluenceHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    connectedAccounts: 0,
    scheduledPosts: 0,
    managedCreators: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [accounts, posts, creators] = await Promise.all([
      supabase.from("social_accounts").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("influencehub_posts").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "scheduled"),
      supabase.from("influencehub_creators").select("id", { count: "exact" }).eq("agency_user_id", user.id),
    ]);

    setStats({
      connectedAccounts: accounts.count || 0,
      scheduledPosts: posts.count || 0,
      managedCreators: creators.count || 0,
    });
  };

  const quickActions = [
    {
      title: "Connect Accounts",
      description: "Link your Instagram, Facebook, and TikTok",
      icon: <Instagram className="h-6 w-6" />,
      onClick: () => navigate("/influencehub/connect"),
    },
    {
      title: "Create Post",
      description: "Schedule content across platforms",
      icon: <Calendar className="h-6 w-6" />,
      onClick: () => navigate("/influencehub/create-post"),
    },
    {
      title: "Media Library",
      description: "Manage your content assets",
      icon: <Image className="h-6 w-6" />,
      onClick: () => navigate("/influencehub/media"),
    },
    {
      title: "Manage Creators",
      description: "Agency: manage multiple creators",
      icon: <Users className="h-6 w-6" />,
      onClick: () => navigate("/influencehub/creators"),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">InfluenceHub</h1>
        <p className="text-muted-foreground">
          Social media management for creators and agencies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedAccounts}</div>
            <p className="text-xs text-muted-foreground">Instagram, Facebook, TikTok</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">Ready to publish</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Managed Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.managedCreators}</div>
            <p className="text-xs text-muted-foreground">Agency accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary"
              onClick={action.onClick}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {action.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      {stats.connectedAccounts === 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Get Started with InfluenceHub</CardTitle>
            <CardDescription>
              Connect your social media accounts to start managing your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/influencehub/connect")}>
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
