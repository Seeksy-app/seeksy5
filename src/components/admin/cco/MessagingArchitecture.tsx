import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, Plus, Edit, CheckCircle2,
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
  audience: string;
  title: string;
  content: string | null;
  key_points: string[];
  channels: string[];
  is_approved: boolean;
  approved_at: string | null;
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
    key_points: ""
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("cco_messaging")
      .select("*")
      .order("message_type")
      .order("created_at", { ascending: false });

    if (data) setMessages(data as MessagingItem[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newMessage.title || !newMessage.content) {
      toast.error("Title and content are required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await (supabase as any).from("cco_messaging").insert({
      user_id: user.id,
      message_type: newMessage.message_type,
      audience: newMessage.audience,
      title: newMessage.title,
      content: newMessage.content,
      key_points: newMessage.key_points.split("\n").map((p: string) => p.trim()).filter(Boolean)
    });

    if (error) {
      toast.error("Failed to create message");
      return;
    }

    toast.success("Message created successfully");
    setIsCreateOpen(false);
    setNewMessage({ message_type: "tagline", audience: "general", title: "", content: "", key_points: "" });
    fetchMessages();
  };

  const handleApprove = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from("cco_messaging")
      .update({ is_approved: true, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      toast.success("Message approved");
      fetchMessages();
    }
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
                <Label>Key Points (one per line)</Label>
                <Textarea 
                  value={newMessage.key_points}
                  onChange={(e) => setNewMessage({ ...newMessage, key_points: e.target.value })}
                  placeholder="Key point 1&#10;Key point 2&#10;Key point 3"
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
                    {getAudienceIcon(message.audience)}
                    <CardTitle className="text-base">{message.title}</CardTitle>
                  </div>
                  <Badge className={message.is_approved ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {message.is_approved ? "Approved" : "Draft"}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {messageTypes.find(t => t.value === message.message_type)?.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {audiences.find(a => a.value === message.audience)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.key_points && message.key_points.length > 0 && (
                  <div className="mt-3 p-2 bg-muted rounded">
                    <p className="text-xs font-medium mb-1">Key Points:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {message.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  {!message.is_approved && (
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
