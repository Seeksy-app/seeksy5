import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings as SettingsIcon, Clock, Users, Bell, Shield } from "lucide-react";

export default function Settings() {
  const { data: slaPolicies = [], isLoading } = useQuery({
    queryKey: ["sla-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_sla_policies")
        .select("*")
        .order("first_response_hours");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Configure Help Desk behavior</p>
      </div>

      {/* Routing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Routing & Assignment
          </CardTitle>
          <CardDescription>Configure how tickets are assigned to team members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto-assign new tickets</Label>
              <p className="text-sm text-muted-foreground">Automatically assign tickets based on category</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Round-robin assignment</Label>
              <p className="text-sm text-muted-foreground">Distribute tickets evenly across available agents</p>
            </div>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Default assignment</Label>
            <Select defaultValue="unassigned">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Leave unassigned</SelectItem>
                <SelectItem value="round-robin">Round robin</SelectItem>
                <SelectItem value="least-busy">Least busy agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SLA Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            SLA Policies
          </CardTitle>
          <CardDescription>Service level agreements by priority</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {slaPolicies.map((policy: any) => (
                <div key={policy.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      policy.priority === "urgent" ? "destructive" :
                      policy.priority === "high" ? "default" :
                      policy.priority === "medium" ? "secondary" : "outline"
                    }>
                      {policy.priority}
                    </Badge>
                    <span className="font-medium">{policy.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>First response: {policy.first_response_hours}h</span>
                    <span>Resolution: {policy.resolution_hours}h</span>
                    <Badge variant={policy.is_active ? "default" : "secondary"}>
                      {policy.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">New ticket notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when new tickets are created</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">SLA breach warnings</Label>
              <p className="text-sm text-muted-foreground">Alert before SLA deadlines are missed</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Assignment notifications</Label>
              <p className="text-sm text-muted-foreground">Notify agents when tickets are assigned</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Priority Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Priority Rules
          </CardTitle>
          <CardDescription>Automatic priority assignment rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto-escalate stale tickets</Label>
              <p className="text-sm text-muted-foreground">Increase priority for tickets without response after 24h</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Keyword-based priority</Label>
              <p className="text-sm text-muted-foreground">Set high priority for tickets containing "urgent", "critical"</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}