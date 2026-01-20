import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, Send, Sparkles, Clock, User, Tag, Monitor, Globe, Paperclip, MessageSquare, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { demoTickets } from "@/data/helpdeskDemoData";

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: string;
  content: string;
  is_internal_note: boolean;
  created_at: string;
}

export default function TicketDetail() {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();
      
      // If not found in DB, check demo tickets
      if (error || !data) {
        const demoTicket = demoTickets.find(t => t.id === ticketId);
        if (demoTicket) {
          return demoTicket;
        }
        throw error || new Error("Ticket not found");
      }
      return data;
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TicketMessage[];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["ticket-tags", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_tag_assignments")
        .select("tag_id, ticket_tags(id, name, color)")
        .eq("ticket_id", ticketId);
      if (error) throw error;
      return data.map((t: any) => t.ticket_tags);
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["ticket-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        sender_id: user?.id,
        sender_type: isInternalNote ? "agent" : "agent",
        content: replyContent,
        is_internal_note: isInternalNote,
      });
      if (error) throw error;

      // Update last_activity_at
      await supabase
        .from("tickets")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", ticketId);
    },
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
      toast.success(isInternalNote ? "Internal note added" : "Reply sent");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const updates: any = { status };
      if (status === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Status updated");
    },
  });

  const updatePriority = useMutation({
    mutationFn: async (priority: string) => {
      const { error } = await supabase
        .from("tickets")
        .update({ priority })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      toast.success("Priority updated");
    },
  });

  const generateAIReply = async () => {
    setIsGeneratingAI(true);
    try {
      // Simulate AI response - in production, call your AI endpoint
      await new Promise((r) => setTimeout(r, 1500));
      const aiReply = `Thank you for reaching out! I understand your concern.\n\nIf you need more help, we're here — hello@seeksy.io`;
      setReplyContent(aiReply);
      toast.success("AI draft generated");
    } catch (error) {
      toast.error("Failed to generate AI reply");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyTemplate = (template: any) => {
    let content = template.content;
    content = content.replace("{{customer_name}}", ticket?.requester_name || "there");
    setReplyContent((prev) => prev + content);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        document.getElementById("reply-textarea")?.focus();
      }
      if (e.key === "Escape") {
        navigate("/helpdesk");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (ticketLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg font-medium">Ticket not found</p>
        <Button variant="link" onClick={() => navigate("/helpdesk")}>
          Back to Inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/helpdesk")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground font-mono">{ticket.ticket_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={ticket.status || "open"} onValueChange={(v) => updateStatus.mutate(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ticket.priority || "medium"} onValueChange={(v) => updatePriority.mutate(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {ticket.ai_summary && (
          <div className="px-6 py-3 bg-primary/5 border-b border-border">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
                <p className="text-sm text-muted-foreground">{ticket.ai_summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Thread */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 max-w-3xl">
            {/* Original ticket message */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {ticket.requester_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{ticket.requester_name || "Customer"}</span>
                  <span className="text-xs text-muted-foreground">
                    {ticket.created_at && format(new Date(ticket.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{ticket.description || "No description provided."}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <div key={message.id} className={cn("flex gap-3", message.is_internal_note && "opacity-75")}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn(
                    "text-xs",
                    message.sender_type === "agent" ? "bg-blue-100 text-blue-600" :
                    message.sender_type === "ai" ? "bg-purple-100 text-purple-600" :
                    "bg-primary/10 text-primary"
                  )}>
                    {message.sender_type === "agent" ? "A" : message.sender_type === "ai" ? "AI" : "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {message.sender_type === "agent" ? "Support Agent" :
                       message.sender_type === "ai" ? "AI Assistant" : "Customer"}
                    </span>
                    {message.is_internal_note && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Internal Note
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className={cn(
                    "rounded-lg p-3",
                    message.is_internal_note ? "bg-yellow-50 border border-yellow-200" : "bg-muted/50"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply Box */}
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="internal-note" checked={isInternalNote} onCheckedChange={setIsInternalNote} />
                <Label htmlFor="internal-note" className="text-sm">Internal Note</Label>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                {templates.slice(0, 3).map((template: any) => (
                  <Button key={template.id} variant="outline" size="sm" onClick={() => applyTemplate(template)}>
                    {template.shortcut_key && <kbd className="mr-1 text-xs">{template.shortcut_key}</kbd>}
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="reply-textarea"
              placeholder={isInternalNote ? "Add an internal note..." : "Type your reply... (press R to focus)"}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={generateAIReply} disabled={isGeneratingAI}>
                  {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="ml-1">AI Reply</span>
                </Button>
              </div>
              <Button onClick={() => sendMessage.mutate()} disabled={!replyContent.trim() || sendMessage.isPending}>
                {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                {isInternalNote ? "Add Note" : "Send Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border bg-muted/30 overflow-auto">
        <div className="p-4 space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{ticket.requester_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{ticket.requester_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{ticket.requester_email || "No email"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag: any) => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </CardContent>
          </Card>

          {/* SLA Timer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Response</span>
                <span className={ticket.first_response_at ? "text-green-600" : "text-orange-600"}>
                  {ticket.first_response_at ? "Met" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{ticket.created_at && formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Device Info */}
          {(ticket.device_info || ticket.browser_info) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Device Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {ticket.browser_info && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Browser:</span>
                    <span>{JSON.stringify(ticket.browser_info)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span>{messages.length + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Activity</span>
                <span>{ticket.last_activity_at && formatDistanceToNow(new Date(ticket.last_activity_at), { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}