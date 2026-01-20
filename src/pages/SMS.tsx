import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, MessageSquare, Send, Users, BarChart3, Calendar } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SMS = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>SMS</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-teal-600">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">SMS Campaigns</h1>
              <p className="text-muted-foreground text-lg mt-1">
                Send text messages and engage your audience on mobile
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Campaigns</h3>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground mt-1">Total SMS campaigns</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Sent</h3>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground mt-1">Messages delivered</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Response Rate</h3>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-sm text-muted-foreground mt-1">Average engagement</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <MessageSquare className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Create SMS Campaign</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Compose and send text messages to your contacts. Perfect for reminders, updates, and time-sensitive announcements.
              </p>
              <Button size="lg" className="gap-2">
                <Send className="h-5 w-5" />
                New Campaign
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-primary/10">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Schedule Messages</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Plan ahead and schedule SMS campaigns to be sent at the optimal time for your audience.
              </p>
              <Button size="lg" variant="outline" className="gap-2">
                <Calendar className="h-5 w-5" />
                Schedule SMS
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Recent Campaigns</h3>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SMS campaigns yet</p>
              <p className="text-sm mt-2">Create your first campaign to get started</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SMS;