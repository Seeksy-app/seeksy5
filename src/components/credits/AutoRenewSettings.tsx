import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 300, price: 19 },
  { id: 'creator', name: 'Creator', credits: 600, price: 39 },
  { id: 'pro', name: 'Pro', credits: 1200, price: 79 },
  { id: 'power', name: 'Power User', credits: 2500, price: 149 },
  { id: 'team', name: 'Studio Team', credits: 5000, price: 279 },
];

export function AutoRenewSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['auto-renew-settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const result = await (supabase as any)
        .from('user_auto_renew_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (result.error && result.error.code !== 'PGRST116') throw result.error;
      return result.data as any;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [selectedPackage, setSelectedPackage] = useState(settings?.package_id || '');
  const [triggerStorage, setTriggerStorage] = useState(settings?.trigger_on_storage_limit ?? true);
  const [triggerRecording, setTriggerRecording] = useState(settings?.trigger_on_recording_limit ?? true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload = {
        user_id: session.user.id,
        enabled,
        package_id: selectedPackage || null,
        trigger_on_storage_limit: triggerStorage,
        trigger_on_recording_limit: triggerRecording,
        updated_at: new Date().toISOString(),
      };

      const result = await (supabase as any)
        .from('user_auto_renew_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-renew-settings'] });
      toast.success("Auto-renew settings saved");
    },
    onError: (error) => {
      toast.error("Failed to save settings", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-Renew Credits
        </CardTitle>
        <CardDescription>
          Automatically purchase credits when you're running low
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-renew">Enable Auto-Renew</Label>
            <p className="text-sm text-muted-foreground">
              Automatically buy credits when balance drops below 100
            </p>
          </div>
          <Switch
            id="auto-renew"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <Label>Package to Auto-Purchase</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {(packages || CREDIT_PACKAGES.map(p => ({ id: p.id, name: p.name, credits: p.credits, price: p.price }))).map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>{pkg.name}</span>
                        <span className="text-muted-foreground">
                          ({pkg.credits} credits - ${pkg.price})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Additional Triggers</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trigger-storage"
                    checked={triggerStorage}
                    onCheckedChange={(c) => setTriggerStorage(!!c)}
                  />
                  <label htmlFor="trigger-storage" className="text-sm">
                    Auto-renew when reaching storage limit
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trigger-recording"
                    checked={triggerRecording}
                    onCheckedChange={(c) => setTriggerRecording(!!c)}
                  />
                  <label htmlFor="trigger-recording" className="text-sm">
                    Auto-renew when reaching recording/streaming limit
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}