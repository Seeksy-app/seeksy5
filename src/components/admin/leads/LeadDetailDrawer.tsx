/**
 * Lead Detail Drawer
 * 
 * Shows lead info, activity timeline, and actions.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Mail, Phone, Building2, Globe, 
  Calendar, TrendingUp, Copy, ExternalLink,
  CheckCircle2, Clock, Eye
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface LeadDetailDrawerProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function LeadDetailDrawer({ lead, open, onOpenChange, workspaceId }: LeadDetailDrawerProps) {
  // Fetch events for this lead
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['lead-events', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      const { data, error } = await supabase
        .from('lead_intel_events')
        .select('*')
        .eq('lead_id', lead.id)
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!lead?.id && open
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (!lead) return null;

  const getIntentColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <Eye className="h-3 w-3" />;
      case 'form_submit':
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">
                {lead.person_name || lead.email || `Lead ${lead.id.slice(0, 8)}`}
              </SheetTitle>
              {lead.company_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {lead.company_name}
                </p>
              )}
            </div>
            <div className={`text-2xl font-bold ${getIntentColor(lead.intent_score || 0)}`}>
              {lead.intent_score || 0}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
            <TabsTrigger value="credits" className="flex-1">Credits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Contact Information</h4>
              
              {lead.email && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lead.email)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lead.phone)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {!lead.email && !lead.phone && (
                <p className="text-sm text-muted-foreground">No contact info available</p>
              )}
            </div>

            {/* Lead Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Lead Details</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {lead.source || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge variant="outline" className="mt-1 uppercase">
                    {lead.lead_type || 'Unknown'}
                  </Badge>
                </div>

                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {lead.status?.replace('_', ' ') || 'New'}
                  </Badge>
                </div>

                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <span className="text-sm font-medium">{lead.confidence || 0}%</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Timeline</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">First seen</span>
                  <span>
                    {lead.first_seen_at 
                      ? format(new Date(lead.first_seen_at), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last seen</span>
                  <span>
                    {lead.last_seen_at 
                      ? formatDistanceToNow(new Date(lead.last_seen_at), { addSuffix: true })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Geo */}
            {lead.geo && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Location</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[lead.geo.city, lead.geo.region, lead.geo.country].filter(Boolean).join(', ') || 'Unknown'}
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ScrollArea className="h-[400px]">
              {eventsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event: any) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventIcon(event.event_type)}
                        <span className="text-sm font-medium capitalize">
                          {event.event_type?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}
                        </span>
                      </div>
                      {event.url && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity recorded yet
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="credits" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Credits consumed for this lead:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Identification</span>
                  <Badge variant="secondary">
                    {lead.email ? '3 cr' : lead.company_name ? '1 cr' : '0 cr'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">AI Summary</span>
                  <Badge variant="secondary">0 cr</Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="absolute bottom-6 left-6 right-6 pt-4 border-t bg-background">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Mark as Contacted
            </Button>
            <Button className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
