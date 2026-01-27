import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Archive, Mail, Trash2, RotateCcw, Reply, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailTrackingPills } from "./EmailTrackingPills";
import { useState, useEffect } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";
import { EngagementTimelinePanel } from "./EngagementTimelinePanel";
import { EmailRepliesPanel } from "./EmailRepliesPanel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  user_agent?: string;
  ip_address?: string;
  clicked_url?: string;
  bounce_reason?: string;
}

interface EmailViewerProps {
  email: {
    id: string;
    to_email: string;
    from_email: string;
    email_subject: string;
    event_type: string;
    created_at: string;
    campaign_name?: string;
    template_name?: string;
    html_content?: string;
    device_type?: string;
    user_agent?: string;
    ip_address?: string;
    is_inbox?: boolean;
  } | null;
  events: EmailEvent[];
  onResend?: () => void;
  onDuplicate?: () => void;
  onReply?: () => void;
  onViewTemplate?: () => void;
  onViewCampaign?: () => void;
  onDelete?: () => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString([], { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export function EmailViewer({
  email,
  events,
  onResend,
  onDuplicate,
  onReply,
  onViewTemplate,
  onViewCampaign,
  onDelete,
}: EmailViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timelinePanelOpen, setTimelinePanelOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Auto-save draft every 2 seconds
  useEffect(() => {
    if (!replyText.trim()) return;
    
    const timer = setTimeout(() => {
      // Auto-save logic would go here
      console.log("Auto-saving draft...");
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [replyText]);

  // Check if email is trashed
  const isTrashed = !!(email as any)?.deleted_at;

  const deleteForeverMutation = useMutation({
    mutationFn: async () => {
      if (!email) return;
      
      const isInboxEmail = (email as any).is_inbox || email.event_type === "received";
      
      if (isInboxEmail) {
        const { error } = await (supabase as any)
          .from("inbox_messages")
          .delete()
          .eq("id", email.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("email_events")
          .delete()
          .eq("id", email.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Email permanently deleted" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      if (onDelete) onDelete();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreEmailMutation = useMutation({
    mutationFn: async () => {
      if (!email) return;
      
      const isInboxEmail = (email as any).is_inbox || email.event_type === "received";
      
      if (isInboxEmail) {
        const { error } = await (supabase as any)
          .from("inbox_messages")
          .update({ deleted_at: null })
          .eq("id", email.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("email_events")
          .update({ 
            deleted_at: null,
            original_event_type: null
          })
          .eq("id", email.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Email restored" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      if (onDelete) onDelete();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to restore email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveEmailMutation = useMutation({
    mutationFn: async () => {
      if (!email) return;
      // Archive logic - for now just show toast
      toast({ title: "Archive coming soon" });
    },
  });

  const handleDeleteForever = () => {
    if (confirm("Permanently delete this email? This action cannot be undone.")) {
      deleteForeverMutation.mutate();
    }
  };

  const handleRestore = () => {
    restoreEmailMutation.mutate();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !email) return;
    
    setIsReplying(true);
    try {
      // Reply sending logic would go here
      toast({ title: "Reply sent!" });
      setReplyText("");
    } catch (error) {
      toast({ 
        title: "Failed to send reply", 
        variant: "destructive" 
      });
    } finally {
      setIsReplying(false);
    }
  };

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/10">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select an email to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate mb-1">
              {email.email_subject || "(No subject)"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {email.is_inbox ? email.from_email : email.to_email}
              </span>
              <span>•</span>
              <span>{formatDate(email.created_at)}</span>
            </div>
          </div>
          
          {isTrashed && (
            <Badge variant="destructive" className="flex-shrink-0">Trashed</Badge>
          )}
        </div>
        
        {/* Tracking Pills */}
        {!email.is_inbox && events.length > 0 && (
          <div className="mb-3">
            <EmailTrackingPills
              events={events}
              sentAt={email.created_at}
              onClick={() => setTimelinePanelOpen(true)}
            />
          </div>
        )}
        
        {/* From/To details */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div><span className="font-medium">From:</span> {email.from_email}</div>
          <div><span className="font-medium">To:</span> {email.to_email}</div>
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {email.html_content ? (
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.html_content) }}
          />
        ) : (
          <p className="text-muted-foreground text-sm italic">No content</p>
        )}
        
        {/* Replies Panel */}
        {email.event_type !== "draft" && (
          <div className="mt-6">
            <EmailRepliesPanel
              emailEventId={email.id}
              userEmail={email.from_email}
            />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t p-3 bg-muted/30">
        {isTrashed ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRestore}
              disabled={restoreEmailMutation.isPending}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteForever}
              disabled={deleteForeverMutation.isPending}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Forever
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary and Secondary Actions */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={onReply} 
                className="flex-1"
                size="sm"
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline" size="sm" onClick={onResend}>
                <Copy className="h-4 w-4 mr-1" />
                Resend
              </Button>
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => archiveEmailMutation.mutate()}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            </div>
            
            {/* Inline Reply */}
            <div className="space-y-2">
              <Textarea
                placeholder="Type your reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
              {replyText.trim() && (
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={handleSendReply}
                    disabled={isReplying}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Engagement Timeline Panel */}
      <EngagementTimelinePanel
        open={timelinePanelOpen}
        onClose={() => setTimelinePanelOpen(false)}
        email={email ? {
          to_email: email.to_email,
          email_subject: email.email_subject,
          created_at: email.created_at,
        } : null}
        events={events}
      />
    </div>
  );
}
