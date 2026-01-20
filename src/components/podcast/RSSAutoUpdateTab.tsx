import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Radio, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface RSSAutoUpdateTabProps {
  userId: string;
}

export const RSSAutoUpdateTab = ({ userId }: RSSAutoUpdateTabProps) => {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const queryClient = useQueryClient();

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

  const { data: autoUpdateSettings, isLoading } = useQuery({
    queryKey: ["rss-auto-updates", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return null;
      const { data, error } = await supabase
        .from("podcast_rss_auto_updates")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      if (!selectedPodcast) return;
      
      const { data, error } = await supabase
        .from("podcast_rss_auto_updates")
        .upsert({
          podcast_id: selectedPodcast,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rss-auto-updates", selectedPodcast] });
      toast.success("RSS auto-update settings saved");
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    },
  });

  const triggerManualUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPodcast) return;
      
      const { data, error } = await supabase.functions.invoke('update-podcast-rss', {
        body: { podcastId: selectedPodcast },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("RSS feed updated across all directories");
      queryClient.invalidateQueries({ queryKey: ["rss-auto-updates", selectedPodcast] });
    },
    onError: (error) => {
      console.error("Error updating RSS:", error);
      toast.error("Failed to update RSS feed");
    },
  });

  const handleToggleAutoUpdate = async (enabled: boolean) => {
    await updateSettingsMutation.mutateAsync({
      auto_update_enabled: enabled,
    });
  };

  const handleUpdateFrequency = async (frequency: string) => {
    await updateSettingsMutation.mutateAsync({
      update_frequency: frequency,
    });
  };

  const handleToggleDirectory = async (directory: string, enabled: boolean) => {
    const currentDirectories = (autoUpdateSettings?.directories as Record<string, boolean>) || {
      spotify: true,
      apple: true,
      google: true,
      all_directories: true,
    };

    await updateSettingsMutation.mutateAsync({
      directories: {
        ...currentDirectories,
        [directory]: enabled,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Radio className="h-4 w-4" />
        <AlertDescription>
          <strong>RSS Auto-Update System:</strong> Automatically updates your podcast RSS feed across all major directories
          (Spotify, Apple Podcasts, Google Podcasts, and more) when you publish new episodes or make changes.
          This ensures your listeners always have access to your latest content without manual updates.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Select Podcast</CardTitle>
          <CardDescription>Choose a podcast to manage RSS auto-updates</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedPodcast && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Auto-Update Settings</span>
                <Badge variant={autoUpdateSettings?.auto_update_enabled ? "default" : "secondary"}>
                  {autoUpdateSettings?.auto_update_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure how and when your RSS feed updates automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-update">Enable Auto-Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically push updates to podcast directories
                  </p>
                </div>
                <Switch
                  id="auto-update"
                  checked={autoUpdateSettings?.auto_update_enabled ?? true}
                  onCheckedChange={handleToggleAutoUpdate}
                  disabled={isLoading}
                />
              </div>

              {autoUpdateSettings?.auto_update_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Update Frequency</Label>
                    <Select
                      value={autoUpdateSettings?.update_frequency || "on_publish"}
                      onValueChange={handleUpdateFrequency}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_publish">On Episode Publish (Recommended)</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose when to automatically update your RSS feed
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Target Directories</Label>
                    <div className="space-y-2">
                      {[
                        { key: "spotify", label: "Spotify" },
                        { key: "apple", label: "Apple Podcasts" },
                        { key: "google", label: "Google Podcasts" },
                        { key: "all_directories", label: "All Other Directories" },
                      ].map((directory) => (
                        <div key={directory.key} className="flex items-center justify-between">
                          <Label htmlFor={directory.key} className="font-normal cursor-pointer">
                            {directory.label}
                          </Label>
                          <Switch
                            id={directory.key}
                            checked={autoUpdateSettings?.directories?.[directory.key] ?? true}
                            onCheckedChange={(checked) => handleToggleDirectory(directory.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {autoUpdateSettings?.last_update_at && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Last updated: {format(new Date(autoUpdateSettings.last_update_at), 'PPpp')}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Update</CardTitle>
              <CardDescription>
                Trigger an immediate RSS feed update across all enabled directories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => triggerManualUpdateMutation.mutate()}
                disabled={triggerManualUpdateMutation.isPending}
                className="w-full"
              >
                {triggerManualUpdateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update RSS Feed Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
