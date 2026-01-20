import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MousePointer, Globe, Smartphone, Monitor, Link2, Mail, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SignatureActivityLogProps {
  signatures: any[];
}

interface TrackingEvent {
  id: string;
  signature_id: string;
  event_type: string;
  link_id: string | null;
  target_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  email_client: string | null;
  created_at: string;
  recipient_email: string | null;
}

export function SignatureActivityLog({ signatures }: SignatureActivityLogProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignature, setSelectedSignature] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [selectedSignature, selectedEventType]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("signature_tracking_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (selectedSignature !== "all") {
        query = query.eq("signature_id", selectedSignature);
      }

      if (selectedEventType !== "all") {
        query = query.eq("event_type", selectedEventType);
      }

      const { data } = await query;
      setEvents((data as TrackingEvent[]) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "open": return <Eye className="h-4 w-4 text-blue-500" />;
      case "banner_click": return <MousePointer className="h-4 w-4 text-green-500" />;
      case "social_click": return <Link2 className="h-4 w-4 text-purple-500" />;
      case "link_click": return <Link2 className="h-4 w-4 text-orange-500" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "open": return "Email Opened";
      case "banner_click": return "Banner Clicked";
      case "social_click": return "Social Icon Clicked";
      case "link_click": return "Link Clicked";
      default: return type;
    }
  };

  const getDeviceIcon = (type: string | null) => {
    if (!type) return <Globe className="h-4 w-4 text-muted-foreground" />;
    if (type.toLowerCase().includes("mobile")) return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  const getSignatureName = (signatureId: string) => {
    const sig = signatures.find(s => s.id === signatureId);
    return sig?.name || "Unknown";
  };

  const filteredEvents = events.filter(event => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const signatureName = getSignatureName(event.signature_id).toLowerCase();
    const eventLabel = getEventLabel(event.event_type).toLowerCase();
    const recipient = event.recipient_email?.toLowerCase() || "";
    return signatureName.includes(query) || eventLabel.includes(query) || recipient.includes(query);
  });

  // Count events by type for quick stats
  const openCount = events.filter(e => e.event_type === "open").length;
  const clickCount = events.filter(e => ["banner_click", "social_click", "link_click"].includes(e.event_type)).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Opens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MousePointer className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clickCount}</p>
                <p className="text-xs text-muted-foreground">Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{signatures.filter(s => s.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active Signatures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Activity Log</CardTitle>
          <CardDescription>View all tracking events across your signatures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSignature} onValueChange={setSelectedSignature}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Signatures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signatures</SelectItem>
                {signatures.map(sig => (
                  <SelectItem key={sig.id} value={sig.id}>{sig.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="open">Opens</SelectItem>
                <SelectItem value="banner_click">Banner Clicks</SelectItem>
                <SelectItem value="social_click">Social Clicks</SelectItem>
                <SelectItem value="link_click">Link Clicks</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Email Client</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading events...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No tracking events yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          <div>
                            <p className="font-medium text-sm">{getEventLabel(event.event_type)}</p>
                            {event.target_url && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.target_url}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getSignatureName(event.signature_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(event.device_type)}
                          <span className="text-sm text-muted-foreground">{event.device_type || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{event.email_client || "Unknown"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), "MMM d, h:mm a")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
