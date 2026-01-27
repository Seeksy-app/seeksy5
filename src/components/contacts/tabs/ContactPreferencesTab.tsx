import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactPreferencesTabProps {
  contactId: string;
}

export function ContactPreferencesTab({ contactId }: ContactPreferencesTabProps) {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["contact-preferences", contactId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("contact_preferences")
        .select("*")
        .eq("contact_id", contactId)
        .single();

      if (result.error && result.error.code !== "PGRST116") throw result.error;
      return (result.data as any) || {
        newsletter: true,
        promotions: true,
        updates: true,
        sms_reminders: false,
      };
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: any) => {
      const result = await (supabase as any)
        .from("contact_preferences")
        .upsert({
          contact_id: contactId,
          ...newPreferences,
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-preferences", contactId] });
      toast.success("Preferences updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Communication Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Control what types of emails this contact receives
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
          <div className="flex-1">
            <Label className="font-medium text-blue-900 dark:text-blue-100">Newsletter</Label>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
              Regular newsletter and updates
            </p>
          </div>
          <Switch
            checked={preferences?.newsletter}
            onCheckedChange={(checked) =>
              updatePreferences.mutate({ ...preferences, newsletter: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
          <div className="flex-1">
            <Label className="font-medium text-green-900 dark:text-green-100">Promotions</Label>
            <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
              Special offers and promotional content
            </p>
          </div>
          <Switch
            checked={preferences?.promotions}
            onCheckedChange={(checked) =>
              updatePreferences.mutate({ ...preferences, promotions: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
          <div className="flex-1">
            <Label className="font-medium text-purple-900 dark:text-purple-100">Updates</Label>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-0.5">
              Account updates and important notifications
            </p>
          </div>
          <Switch
            checked={preferences?.updates}
            onCheckedChange={(checked) =>
              updatePreferences.mutate({ ...preferences, updates: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900">
          <div className="flex-1">
            <Label className="font-medium text-orange-900 dark:text-orange-100">SMS Reminders</Label>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">
              Text message reminders and alerts
            </p>
          </div>
          <Switch
            checked={preferences?.sms_reminders}
            onCheckedChange={(checked) =>
              updatePreferences.mutate({ ...preferences, sms_reminders: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
