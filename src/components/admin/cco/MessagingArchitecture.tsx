import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, Plus, Edit, Eye, CheckCircle2, Clock,
  Users, Target, Briefcase, Building, Flag, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MessagingItem {
  id: string;
  message_type: string;
  audience: string | null;
  title: string;
  content: string;
  version: number;
  status: string;
  usage_guidelines: string | null;
  created_at: string;
  updated_at: string;
}

const messageTypes = [
  { value: "vision", label: "Vision", icon: Globe },
  { value: "mission", label: "Mission", icon: Target },
  { value: "tagline", label: "Tagline", icon: MessageCircle },
  { value: "positioning", label: "Positioning", icon: Flag },
  { value: "value_prop", label: "Value Proposition", icon: Briefcase },
  { value: "objection_response", label: "Objection Response", icon: Users },
  { value: "elevator_pitch", label: "Elevator Pitch", icon: Building }
];

const audiences = [
  { value: "creators", label: "Creators" },
  { value: "advertisers", label: "Advertisers" },
  { value: "press", label: "Press" },
  { value: "investors", label: "Investors" },
  { value: "veterans", label: "Veterans" },
  { value: "businesses", label: "Businesses" },
  { value: "general", label: "General" }
];

export function MessagingArchitecture() {
  const [messages, setMessages] = useState<MessagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    message_type: "tagline",
    audience: "general",
    title: "",
    content: "",
    usage_guidelines: ""
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cco_messaging")
      .select("*")
      .order("message_type")
      .order("created_at", { ascending: false });

    if (data) setMessages(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newMessage.title || !newMessage.content) {
      toast.error("Title and content are required");
      return;
    }

    const { error } = await supabase.from("cco_messaging").insert({
      message_type: newMessage.message_type,
      audience: newMessage.audience,
      title: newMessage.title,
      content: newMessage.content,
      usage_guidelines: newMessage.usage_guidelines || null
    });

    if (error) {
      toast.error("Failed to create message");
      return;
    }

    toast.success("Message created successfully");
    setIsCreateOpen(false);
    setNewMessage({ message_type: "tagline", audience: "general", title: "", content: "", usage_guidelines: "" });
    fetchMessages();
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("cco_messaging")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      toast.success("Message approved");
      fetchMessages();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getAudienceIcon = (audience: string) => {
    const icons: Record<string, React.ReactNode> = {
      creators: <Users className="h-4 w-4" />,
      advertisers: <Briefcase className="h-4 w-4" />,
      press: <MessageCircle className="h-4 w-4" />,
      investors: <Building className="h-4 w-4" />,
      veterans: <Flag className="h-4 w-4" />,
      businesses: <Target className="h-4 w-4" />,
      general: <Globe className="h-4 w-4" />
    };
    return icons[audience] || <Globe className="h-4 w-4" />;
  };

  const filteredMessages = selectedType === "all" 
    ? messages 
    : messages.filter(m => m.message_type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Messaging Architecture</h2>
          <p className="text-muted-foreground text-sm">
            Official Seeksy messaging for all audiences and use cases
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Message Type</Label>
                  <Select 
                    value={newMessage.message_type} 
                    onValueChange={(v) => setNewMessage({ ...newMessage, message_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {messageTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Select 
                    value={newMessage.audience} 
                    onValueChange={(v) => setNewMessage({ ...newMessage, audience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map(aud => (
                        <SelectItem key={aud.value} value={aud.value}>{aud.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input 
                  value={newMessage.title}
                  onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                  placeholder="e.g., Primary Tagline for Creators"
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea 
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="The actual message content..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Usage Guidelines</Label>
                <Textarea 
                  value={newMessage.usage_guidelines}
                  onChange={(e) => setNewMessage({ ...newMessage, usage_guidelines: e.target.value })}
                  placeholder="When and how to use this message..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <Badge 
          variant={selectedType === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedType("all")}
        >
          All
        </Badge>
        {messageTypes.map(type => (
          <Badge 
            key={type.value}
            variant={selectedType === type.value ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedType(type.value)}
          >
            {type.label}
          </Badge>
        ))}
      </div>

      {/* Messages Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredMessages.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
              <p className="text-sm">Create your first message to get started</p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {message.audience && getAudienceIcon(message.audience)}
                    <CardTitle className="text-base">{message.title}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(message.status)}>{message.status}</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {messageTypes.find(t => t.value === message.message_type)?.label}
                  </Badge>
                  {message.audience && (
                    <Badge variant="secondary" className="text-xs">
                      {audiences.find(a => a.value === message.audience)?.label}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">v{message.version}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.usage_guidelines && (
                  <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
                    <strong>Usage:</strong> {message.usage_guidelines}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  {message.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(message.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
