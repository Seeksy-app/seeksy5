import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface EmailRepliesPanelProps {
  emailEventId: string;
  userEmail: string;
}

interface Reply {
  id: string;
  from_address: string;
  from_name: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  gmail_message_id: string;
}

export function EmailRepliesPanel({ emailEventId, userEmail }: EmailRepliesPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Fetch replies for this email
  const { data: replies = [], isLoading } = useQuery({
    queryKey: ["email-replies", emailEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_replies")
        .select("*")
        .eq("email_event_id", emailEventId)
        .order("received_at", { ascending: false });

      if (error) throw error;
      return data as Reply[];
    },
  });

  // Sync replies mutation
  const syncRepliesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-gmail-replies", {
        method: "POST",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-replies"] });
      toast({
        title: "Replies synced",
        description: data.newRepliesAdded > 0 
          ? `Found ${data.newRepliesAdded} new ${data.newRepliesAdded === 1 ? 'reply' : 'replies'}`
          : "No new replies found",
      });
      setSyncing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync replies",
        variant: "destructive",
      });
      setSyncing(false);
    },
  });

  const handleSync = () => {
    setSyncing(true);
    syncRepliesMutation.mutate();
  };

  const openInGmail = (messageId: string) => {
    // Gmail message URL format
    window.open(`https://mail.google.com/mail/u/0/#inbox/${messageId}`, "_blank");
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">
            Replies ({replies.length})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing || syncRepliesMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync Replies
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading replies...
        </div>
      ) : replies.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No replies yet. Click "Sync Replies" to check Gmail.
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {(reply.from_name || reply.from_address).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {reply.from_name || reply.from_address}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => openInGmail(reply.gmail_message_id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                  </div>
                  
                  {reply.from_name && (
                    <div className="text-xs text-muted-foreground mb-1">
                      {reply.from_address}
                    </div>
                  )}
                  
                  {reply.snippet && (
                    <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                      {reply.snippet}
                    </p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(reply.received_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}