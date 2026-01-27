import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RSSMigrationWizard } from "./RSSMigrationWizard";

interface RSSMigrationTabProps {
  userId: string;
}

export function RSSMigrationTab({ userId }: RSSMigrationTabProps) {
  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const [showWizard, setShowWizard] = useState(false);

  const { data: migrations } = useQuery({
    queryKey: ["rss-migrations", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      const result = await (supabase as any)
        .from("rss_migrations")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data as any[];
    },
    enabled: !!selectedPodcast,
  });

  return (
    <div className="space-y-6">
      {!showWizard && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>RSS Feed Migration</CardTitle>
              <CardDescription>
                Seamlessly migrate your podcast RSS feed to Seeksy with automatic redirect setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="podcast">Select Podcast to Migrate</Label>
                <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a podcast" />
                  </SelectTrigger>
                  <SelectContent>
                    {podcasts?.map((podcast) => (
                      <SelectItem key={podcast.id} value={podcast.id}>
                        {podcast.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setShowWizard(true)} 
                disabled={!selectedPodcast}
                className="w-full"
              >
                Start Migration Wizard
              </Button>
            </CardContent>
          </Card>

          {selectedPodcast && migrations && migrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Migrations</CardTitle>
                <CardDescription>
                  View your migration history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {migrations.map((migration) => (
                    <div key={migration.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {migration.migration_step === 'complete' ? (
                            <span className="text-green-600">✓ Complete</span>
                          ) : (
                            <span className="text-yellow-600">In Progress</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(migration.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Old: {migration.old_rss_url}</p>
                        <p className="text-muted-foreground">New: {migration.new_rss_url}</p>
                        {migration.redirect_status && (
                          <p className="font-medium">Status: {migration.redirect_status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showWizard && selectedPodcast && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setShowWizard(false)}>
            ← Back to Podcast Selection
          </Button>
          <RSSMigrationWizard userId={userId} podcastId={selectedPodcast} />
        </div>
      )}
    </div>
  );
}