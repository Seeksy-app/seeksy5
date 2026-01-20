import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, Mail, Phone, Building, Calendar, Clock, CreditCard,
  MessageSquare, TrendingUp, AlertCircle, CheckCircle2, Plus,
  Send, Edit, DollarSign, Tag
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  contactId: string | null;
}

interface Contact {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  avatar_url: string | null;
  lead_stage: string;
  tags: string[];
  health_score: number;
  total_revenue: number;
  lifetime_value: number;
  first_seen_at: string;
  last_activity_at: string;
  notes: string | null;
}

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
}

export function UserProfileDrawer({ open, onClose, contactId }: UserProfileDrawerProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (contactId && open) {
      fetchContact();
      fetchActivities();
    }
  }, [contactId, open]);

  const fetchContact = async () => {
    if (!contactId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("id", contactId)
      .single();
    
    if (data) setContact(data);
    setLoading(false);
  };

  const fetchActivities = async () => {
    if (!contactId) return;
    const { data } = await supabase
      .from("crm_activity_timeline")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    setActivities(data || []);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !contactId) return;
    
    await supabase.from("crm_activity_timeline").insert({
      contact_id: contactId,
      activity_type: "note",
      title: "Note added",
      description: newNote
    });
    
    toast.success("Note added");
    setNewNote("");
    fetchActivities();
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      engaged: "bg-green-100 text-green-800",
      qualified: "bg-purple-100 text-purple-800",
      converted: "bg-emerald-100 text-emerald-800",
      churn_risk: "bg-red-100 text-red-800",
      re_engagement_needed: "bg-orange-100 text-orange-800"
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <Mail className="h-4 w-4" />,
      ticket: <MessageSquare className="h-4 w-4" />,
      payment: <CreditCard className="h-4 w-4" />,
      note: <Edit className="h-4 w-4" />,
      login: <User className="h-4 w-4" />,
      meeting: <Calendar className="h-4 w-4" />
    };
    return icons[type] || <Clock className="h-4 w-4" />;
  };

  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={contact.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {contact.name?.charAt(0) || contact.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{contact.name || contact.email}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStageColor(contact.lead_stage)}>
                  {contact.lead_stage.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline">
                  Health: {contact.health_score}%
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="w-full justify-start px-6 border-b rounded-none">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-220px)]">
            <TabsContent value="overview" className="p-6 space-y-6 m-0">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">First seen: {new Date(contact.first_seen_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">${contact.total_revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">${contact.lifetime_value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Lifetime Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Note */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Add Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Add a note about this contact..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button className="mt-2" size="sm" onClick={handleAddNote}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="p-6 m-0">
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-3 border rounded-lg">
                      <div className="p-2 bg-muted rounded-full h-fit">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="billing" className="p-6 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Billing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-bold">${contact.total_revenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm">Lifetime Value</span>
                    <span className="font-bold">${contact.lifetime_value.toFixed(2)}</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Full Billing History
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="p-6 m-0">
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No support tickets found</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
