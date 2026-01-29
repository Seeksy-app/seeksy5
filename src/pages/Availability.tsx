import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockedTime {
  id?: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const Availability = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [zoomConnected, setZoomConnected] = useState(false);
  const [zoomEmail, setZoomEmail] = useState<string | null>(null);
  const [connectingZoom, setConnectingZoom] = useState(false);
  
  const [timezone, setTimezone] = useState("America/New_York");
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, AvailabilitySlot[]>>({});
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  
  // For adding blocked times
  const [showBlockedTimeForm, setShowBlockedTimeForm] = useState(false);
  const [newBlockedStart, setNewBlockedStart] = useState<Date>();
  const [newBlockedEnd, setNewBlockedEnd] = useState<Date>();
  const [newBlockedReason, setNewBlockedReason] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadAvailability(session.user.id);
      }
    });
    
    // Check for OAuth success/error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Calendar connected!",
        description: "Your Google Calendar has been successfully connected",
      });
      // Clean URL
      window.history.replaceState({}, '', '/availability');
      // Reload to get connection status
      if (user) loadAvailability(user.id);
    } else if (urlParams.get('zoom_success') === 'true') {
      toast({
        title: "Zoom connected!",
        description: "Your Zoom account has been successfully connected",
      });
      // Clean URL
      window.history.replaceState({}, '', '/availability');
      // Reload to get connection status
      if (user) loadAvailability(user.id);
    } else if (urlParams.get('error')) {
      const errorType = urlParams.get('error');
      let description = "Failed to connect. Please try again.";
      if (errorType?.includes('zoom')) {
        description = "Failed to connect Zoom. Please try again.";
      } else if (errorType?.includes('calendar')) {
        description = "Failed to connect Google Calendar. Please try again.";
      }
      toast({
        title: "Connection failed",
        description,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/availability');
    }
  }, [navigate]);

  const loadAvailability = async (userId: string) => {
    try {
      // Load timezone settings
      const settingsResult = await (supabase as any)
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      const settings = settingsResult.data as any;

      if (settings) {
        setTimezone(settings.timezone);
      }

      // Load weekly schedule
      const scheduleResult = await (supabase as any)
        .from("availability_schedules")
        .select("*")
        .eq("user_id", userId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (scheduleResult.error) throw scheduleResult.error;
      const scheduleData = scheduleResult.data as any[];

      // Group by day
      const grouped: Record<number, AvailabilitySlot[]> = {};
      scheduleData?.forEach((slot: any) => {
        if (!grouped[slot.day_of_week]) {
          grouped[slot.day_of_week] = [];
        }
        grouped[slot.day_of_week].push(slot as AvailabilitySlot);
      });
      setWeeklySchedule(grouped);

      // Load blocked times
      const blockedResult = await (supabase as any)
        .from("blocked_times")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (blockedResult.error) throw blockedResult.error;
      setBlockedTimes((blockedResult.data as BlockedTime[]) || []);

      // Check calendar connection
      const calResult = await (supabase as any)
        .from("calendar_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "google")
        .single();
      const calendarData = calResult.data as any;

      if (calendarData) {
        setCalendarConnected(true);
        setCalendarEmail(calendarData.calendar_email);
      }

      // Check Zoom connection
      const zoomResult = await (supabase as any)
        .from("zoom_connections")
        .select("*")
        .eq("user_id", userId)
        .single();
      const zoomData = zoomResult.data as any;

      if (zoomData) {
        setZoomConnected(true);
        setZoomEmail(zoomData.zoom_email);
      }
    } catch (error: any) {
      toast({
        title: "Error loading availability",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    if (!user) return;
    
    setConnectingCalendar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error connecting calendar",
        description: error.message,
        variant: "destructive",
      });
      setConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user) return;
    
    try {
      const result = await (supabase as any)
        .from("calendar_connections")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", "google");

      if (result.error) throw result.error;

      setCalendarConnected(false);
      setCalendarEmail(null);
      
      toast({
        title: "Calendar disconnected",
        description: "Your Google Calendar has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Error disconnecting calendar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConnectZoom = async () => {
    if (!user) return;
    
    setConnectingZoom(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoom-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error connecting Zoom",
        description: error.message,
        variant: "destructive",
      });
      setConnectingZoom(false);
    }
  };

  const handleDisconnectZoom = async () => {
    if (!user) return;
    
    try {
      const result = await (supabase as any)
        .from("zoom_connections")
        .delete()
        .eq("user_id", user.id);

      if (result.error) throw result.error;

      setZoomConnected(false);
      setZoomEmail(null);
      
      toast({
        title: "Zoom disconnected",
        description: "Your Zoom account has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Error disconnecting Zoom",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTimeSlot = (day: number) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    };
    
    setWeeklySchedule({
      ...weeklySchedule,
      [day]: [...(weeklySchedule[day] || []), newSlot],
    });
  };

  const removeTimeSlot = (day: number, index: number) => {
    const daySlots = [...(weeklySchedule[day] || [])];
    daySlots.splice(index, 1);
    setWeeklySchedule({
      ...weeklySchedule,
      [day]: daySlots,
    });
  };

  const updateTimeSlot = (day: number, index: number, field: keyof AvailabilitySlot, value: any) => {
    const daySlots = [...(weeklySchedule[day] || [])];
    daySlots[index] = { ...daySlots[index], [field]: value };
    setWeeklySchedule({
      ...weeklySchedule,
      [day]: daySlots,
    });
  };

  const addBlockedTime = () => {
    if (!newBlockedStart || !newBlockedEnd) return;
    
    setBlockedTimes([
      ...blockedTimes,
      {
        start_time: newBlockedStart.toISOString(),
        end_time: newBlockedEnd.toISOString(),
        reason: newBlockedReason,
      },
    ]);
    
    setNewBlockedStart(undefined);
    setNewBlockedEnd(undefined);
    setNewBlockedReason("");
    setShowBlockedTimeForm(false);
  };

  const removeBlockedTime = (index: number) => {
    setBlockedTimes(blockedTimes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Upsert timezone settings
      const settingsResult = await (supabase as any)
        .from("user_settings")
        .upsert({
          user_id: user.id,
          timezone,
        });

      if (settingsResult.error) throw settingsResult.error;

      // Delete existing availability schedules
      await (supabase as any)
        .from("availability_schedules")
        .delete()
        .eq("user_id", user.id);

      // Insert new availability schedules
      const allSlots = Object.values(weeklySchedule).flat();
      if (allSlots.length > 0) {
        const slotsToInsert = allSlots.map((slot) => ({
          user_id: user.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        }));

        const slotsResult = await (supabase as any)
          .from("availability_schedules")
          .insert(slotsToInsert);

        if (slotsResult.error) throw slotsResult.error;
      }

      // Delete existing blocked times
      await (supabase as any)
        .from("blocked_times")
        .delete()
        .eq("user_id", user.id);

      // Insert new blocked times
      if (blockedTimes.length > 0) {
        const blockedToInsert = blockedTimes.map((blocked) => ({
          user_id: user.id,
          start_time: blocked.start_time,
          end_time: blocked.end_time,
          reason: blocked.reason,
        }));

        const blockedResult = await (supabase as any)
          .from("blocked_times")
          .insert(blockedToInsert);

        if (blockedResult.error) throw blockedResult.error;
      }

      toast({
        title: "Availability saved!",
        description: "Your schedule has been updated.",
      });

      navigate("/meeting-types");
    } catch (error: any) {
      toast({
        title: "Error saving availability",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Availability</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold">Availability Settings</h1>
          <p className="text-muted-foreground mt-2">
            Set your working hours and block out busy times
          </p>
        </div>

        <div className="space-y-6">
          {/* Calendar Connection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Google Calendar Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to automatically check availability and create calendar events
                </p>
              </div>
              
              {calendarConnected ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Calendar Connected</p>
                      {calendarEmail && (
                        <p className="text-sm text-green-700 dark:text-green-300">{calendarEmail}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectCalendar}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnectCalendar}
                  disabled={connectingCalendar}
                  className="w-full"
                >
                  {connectingCalendar ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Connect Google Calendar
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Zoom Integration */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Zoom Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect your Zoom account to automatically create meeting links
                </p>
              </div>
              
              {zoomConnected ? (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Zoom Connected</p>
                      {zoomEmail && (
                        <p className="text-sm text-green-700 dark:text-green-300">{zoomEmail}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectZoom}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnectZoom}
                  disabled={connectingZoom}
                  className="w-full"
                >
                  {connectingZoom ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Connect Zoom
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Timezone */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Your timezone will be used to display available meeting times
                </p>
              </div>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Weekly Schedule */}
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Weekly Hours</h2>
              <p className="text-sm text-muted-foreground">
                Set your available hours for each day of the week
              </p>
            </div>

            <div className="space-y-6">
              {DAYS.map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg">{day}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(dayIndex)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Hours
                    </Button>
                  </div>

                  {weeklySchedule[dayIndex]?.length > 0 ? (
                    <div className="space-y-2">
                      {weeklySchedule[dayIndex].map((slot, slotIndex) => (
                        <Card key={slotIndex} className="p-4 bg-muted/50">
                          <div className="flex gap-4 items-center">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) =>
                                    updateTimeSlot(dayIndex, slotIndex, "start_time", e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) =>
                                    updateTimeSlot(dayIndex, slotIndex, "end_time", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">Unavailable</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Blocked Times */}
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-semibold">Date Overrides</h2>
                  <p className="text-sm text-muted-foreground">
                    Block out specific dates and times (vacations, meetings, etc.)
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowBlockedTimeForm(!showBlockedTimeForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Override
                </Button>
              </div>
            </div>

            {showBlockedTimeForm && (
              <Card className="p-6 mb-6 bg-muted/50">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date & Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newBlockedStart && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockedStart ? format(newBlockedStart, "PPP p") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newBlockedStart}
                            onSelect={setNewBlockedStart}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date & Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newBlockedEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockedEnd ? format(newBlockedEnd, "PPP p") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newBlockedEnd}
                            onSelect={setNewBlockedEnd}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason (optional)</Label>
                    <Textarea
                      value={newBlockedReason}
                      onChange={(e) => setNewBlockedReason(e.target.value)}
                      placeholder="e.g., Vacation, Conference, etc."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addBlockedTime}
                      disabled={!newBlockedStart || !newBlockedEnd}
                    >
                      Add Override
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBlockedTimeForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {blockedTimes.length > 0 ? (
              <div className="space-y-3">
                {blockedTimes.map((blocked, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(blocked.start_time), "PPP p")} -{" "}
                          {format(new Date(blocked.end_time), "PPP p")}
                        </div>
                        {blocked.reason && (
                          <p className="text-sm text-muted-foreground">{blocked.reason}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlockedTime(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No date overrides set</p>
              </div>
            )}
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/meeting-types")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Availability
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Availability;
