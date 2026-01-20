/**
 * Admin Settings Page
 * Manage global app configuration including Holiday Mode
 */

import { useState } from "react";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Snowflake, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSettings() {
  const { data: settings, isLoading } = useHolidaySettings();
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleToggleHolidayMode = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({ holiday_mode: checked })
        .eq("key", "global");

      if (error) throw error;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["holiday-settings"] });

      toast({
        title: checked ? "Holiday Mode enabled 🎄" : "Holiday Mode disabled",
        description: checked
          ? "The festive Seeksy experience is now active"
          : "Holiday features have been turned off",
      });
    } catch (err) {
      console.error("Failed to update holiday mode:", err);
      toast({
        title: "Update failed",
        description: "Could not save holiday mode setting",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleSnowfall = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .update({ holiday_snow: checked })
        .eq("key", "global");

      if (error) throw error;

      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["holiday-settings"] });

      toast({
        title: checked ? "Snowfall enabled ❄️" : "Snowfall disabled",
        description: checked
          ? "Subtle snowfall will appear on key pages"
          : "Snowfall has been turned off",
      });
    } catch (err) {
      console.error("Failed to update snowfall:", err);
      toast({
        title: "Update failed",
        description: "Could not save snowfall setting",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const holidayMode = settings?.holidayMode ?? false;
  const holidaySnow = settings?.holidaySnow ?? false;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Settings</h1>
        <p className="text-muted-foreground">
          Manage global platform configuration and seasonal features
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Seasonal & Visual Settings
          </CardTitle>
          <CardDescription>
            Control holiday-themed features and visual effects across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Holiday Mode Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-1 space-y-1">
              <Label htmlFor="holiday-mode" className="text-base font-medium cursor-pointer">
                Holiday Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Turn on the festive Seeksy experience with Santa Spark, holiday welcome modal,
                and seasonal accents.
              </p>
            </div>
            <Switch
              id="holiday-mode"
              checked={holidayMode}
              onCheckedChange={handleToggleHolidayMode}
              disabled={updating}
            />
          </div>

          {/* Snowfall Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="snowfall"
                className={`text-base font-medium ${
                  !holidayMode ? "text-muted-foreground" : "cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4" />
                  Snowfall
                </span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable subtle, performance-friendly snowfall on key pages.
                {!holidayMode && " (Only available when Holiday Mode is on)"}
              </p>
            </div>
            <Switch
              id="snowfall"
              checked={holidaySnow}
              onCheckedChange={handleToggleSnowfall}
              disabled={updating || !holidayMode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
