import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, FileText, Users, Vote, Radio, Mic, ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action_type: string;
  action_description: string;
  related_entity_type: string | null;
  created_at: string;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysActivities();

    // Subscribe to new activities
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        () => {
          fetchTodaysActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodaysActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "meeting_created":
        return <Calendar className="h-4 w-4" />;
      case "event_created":
        return <Calendar className="h-4 w-4" />;
      case "poll_created":
        return <Vote className="h-4 w-4" />;
      case "podcast_created":
        return <Radio className="h-4 w-4" />;
      case "episode_uploaded":
        return <Mic className="h-4 w-4" />;
      case "signup_sheet_created":
        return <ClipboardList className="h-4 w-4" />;
      case "task_created":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case "meeting_created":
        return "bg-blue-500/10 text-blue-700 border-blue-300";
      case "event_created":
        return "bg-purple-500/10 text-purple-700 border-purple-300";
      case "poll_created":
        return "bg-green-500/10 text-green-700 border-green-300";
      case "podcast_created":
        return "bg-orange-500/10 text-orange-700 border-orange-300";
      case "episode_uploaded":
        return "bg-red-500/10 text-red-700 border-red-300";
      case "signup_sheet_created":
        return "bg-cyan-500/10 text-cyan-700 border-cyan-300";
      case "task_created":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-300";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-300";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Activity Log - Today</CardTitle>
          <CardDescription>Loading your activities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              My Activity Log - Today
            </CardTitle>
            <CardDescription>
              Track everything you've accomplished today
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            {activities.length} {activities.length === 1 ? 'action' : 'actions'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activities logged yet today</p>
            <p className="text-sm mt-1">Start creating and your actions will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(activity.action_type)}`}>
                    {getActivityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.action_description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}