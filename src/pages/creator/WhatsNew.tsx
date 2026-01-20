import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Star, Zap, Bug, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadUpdates } from "@/hooks/useUnreadUpdates";

interface PlatformUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'update';
  items: string[];
  visibility: string[];
  published_at: string;
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "feature":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Sparkles className="h-3 w-3 mr-1" />New Feature</Badge>;
    case "improvement":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Zap className="h-3 w-3 mr-1" />Improvement</Badge>;
    case "bugfix":
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><Bug className="h-3 w-3 mr-1" />Bug Fix</Badge>;
    default:
      return <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Update</Badge>;
  }
};

export default function CreatorWhatsNew() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { unreadCount, markAllAsRead } = useUnreadUpdates('creator');

  const { data: updates, isLoading } = useQuery({
    queryKey: ['platform-updates', 'creator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_updates')
        .select('*')
        .contains('visibility', ['creator'])
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as PlatformUpdate[];
    }
  });

  // Fetch read status
  useQuery({
    queryKey: ['user-update-reads', 'creator'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', user.id);
      
      setReadIds(new Set(data?.map(r => r.update_id) || []));
      return data;
    }
  });

  // Mark all as read when visiting
  useEffect(() => {
    if (updates?.length) {
      markAllAsRead.mutate(updates.map(u => u.id));
    }
  }, [updates]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            What's New
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Latest updates and improvements for creators</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading updates...</div>
      ) : updates?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No updates to show yet. Check back soon!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {updates?.map((entry) => (
            <Card key={entry.id} className={!readIds.has(entry.id) ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    {getTypeBadge(entry.type)}
                    {!readIds.has(entry.id) && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">v{entry.version}</span>
                    <span className="mx-2">•</span>
                    {new Date(entry.published_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{entry.description}</p>
                {entry.items && entry.items.length > 0 && (
                  <ul className="space-y-2">
                    {entry.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
