import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, MessageSquare, Clock, User, AlertTriangle, CheckCircle2, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Check if Twilio is configured (in real app, this would come from backend)
const twilioConfigured = true; // TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER are set

const smsTemplates = [
  { id: "confirmation", name: "Booking Confirmation", enabled: true, template: "Hi {{name}}, your {{meeting_type}} is confirmed for {{date}} at {{time}}. See you then! - Seeksy Team" },
  { id: "reminder_24h", name: "24-Hour Reminder", enabled: true, template: "Reminder: Your {{meeting_type}} with {{host}} is tomorrow at {{time}}. Reply STOP to opt out." },
  { id: "reminder_1h", name: "1-Hour Reminder", enabled: true, template: "Your {{meeting_type}} starts in 1 hour at {{time}}. Join here: {{link}}" },
];

export default function AdminMeetingSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaultTimezone: "America/New_York",
    defaultHost: "sales@seeksy.io",
    smsEnabled: twilioConfigured,
    emailEnabled: true,
    aiSchedulingEnabled: false,
    bufferBefore: "5",
    bufferAfter: "5",
    minNotice: "24",
    maxAdvance: "60",
  });

  const [templates, setTemplates] = useState(smsTemplates);

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Meeting settings have been updated." });
  };

  const toggleTemplate = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-8">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meeting Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global meeting defaults and notifications</p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sms">SMS Templates</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Default Settings
              </CardTitle>
              <CardDescription>Configure default values for all meeting types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select value={settings.defaultTimezone} onValueChange={(v) => setSettings({ ...settings, defaultTimezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Host Email</Label>
                  <Input 
                    value={settings.defaultHost} 
                    onChange={(e) => setSettings({ ...settings, defaultHost: e.target.value })}
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Minimum Notice (hours)</Label>
                  <Select value={settings.minNotice} onValueChange={(v) => setSettings({ ...settings, minNotice: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Advance Booking (days)</Label>
                  <Select value={settings.maxAdvance} onValueChange={(v) => setSettings({ ...settings, maxAdvance: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">2 weeks</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="60">2 months</SelectItem>
                      <SelectItem value="90">3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Buffer Times
              </CardTitle>
              <CardDescription>Add buffer time before and after meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Buffer Before Meeting (minutes)</Label>
                  <Select value={settings.bufferBefore} onValueChange={(v) => setSettings({ ...settings, bufferBefore: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Buffer After Meeting (minutes)</Label>
                  <Select value={settings.bufferAfter} onValueChange={(v) => setSettings({ ...settings, bufferAfter: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          {!twilioConfigured && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SMS Reminders Disabled</AlertTitle>
              <AlertDescription>
                Twilio is not fully configured. Add environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) to enable SMS notifications.
              </AlertDescription>
            </Alert>
          )}

          {twilioConfigured && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Twilio Connected</AlertTitle>
              <AlertDescription>SMS notifications are available. You can enable them below.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send confirmation and reminder emails</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.emailEnabled} 
                  onCheckedChange={(v) => setSettings({ ...settings, emailEnabled: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Send SMS reminders via Twilio</p>
                  </div>
                  {!twilioConfigured && <Badge variant="outline" className="text-orange-600 border-orange-300">Not Configured</Badge>}
                </div>
                <Switch 
                  checked={settings.smsEnabled} 
                  onCheckedChange={(v) => setSettings({ ...settings, smsEnabled: v })}
                  disabled={!twilioConfigured}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">AI Scheduling Assistant</p>
                    <p className="text-sm text-muted-foreground">Let AI help schedule and reschedule meetings</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <Switch 
                  checked={settings.aiSchedulingEnabled} 
                  onCheckedChange={(v) => setSettings({ ...settings, aiSchedulingEnabled: v })}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6 mt-6">
          {!twilioConfigured ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>SMS Not Available</AlertTitle>
              <AlertDescription>
                Configure Twilio environment variables to enable SMS templates.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Switch 
                        checked={template.enabled} 
                        onCheckedChange={() => toggleTemplate(template.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={template.template} 
                      className="font-mono text-sm"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Variables: {"{{name}}, {{meeting_type}}, {{date}}, {{time}}, {{host}}, {{link}}"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Phone Number</p>
                  <p className="text-sm text-muted-foreground">Require phone number for all bookings</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Rescheduling</p>
                  <p className="text-sm text-muted-foreground">Let attendees reschedule their meetings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Cancellation</p>
                  <p className="text-sm text-muted-foreground">Let attendees cancel their meetings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Add to Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Automatically create Google Calendar events</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
