import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Circle, Mail, Trash2, Eye, MousePointer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Email {
  id: string;
  to_email: string;
  email_subject: string;
  event_type: string;
  created_at: string;
  campaign_name?: string;
  from_email?: string;
  from_name?: string;
  reply_count?: number;
  is_read?: boolean;
  deleted_at?: string | null;
  original_event_type?: string | null;
  is_inbox?: boolean;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  onEmailSelect: (emailId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onCompose: () => void;
  onOpenTimeline?: () => void;
  emailEvents?: any[];
}

const getStatusColor = (eventType: string) => {
  const normalized = eventType.replace("email.", "");
  
  switch (normalized) {
    case "delivered":
      return "text-green-500";
    case "opened":
      return "text-blue-500";
    case "clicked":
      return "text-purple-500";
    case "bounced":
      return "text-red-500";
    case "received":
      return "text-emerald-500";
    case "sent":
      return "text-blue-400";
    case "draft":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
};

const formatTimestamp = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const DONT_SHOW_DELETE_CONFIRM_KEY = "seeksy_email_delete_dont_show";

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  onCompose,
  onOpenTimeline,
  emailEvents = [],
}: EmailListProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [skipConfirmation, setSkipConfirmation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DONT_SHOW_DELETE_CONFIRM_KEY);
    if (stored === "true") {
      setSkipConfirmation(true);
    }
  }, []);

  // Filter emails based on selected filter
  const filteredEmails = emails.filter(email => {
    if (filter === "all") return true;
    if (filter === "unread") return email.is_read === false;
    if (filter === "replied") return (email.reply_count || 0) > 0;
    return true;
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      for (const emailId of emailIds) {
        const email = emails.find((e: any) => e.id === emailId);
        
        if (email?.event_type === "draft") {
          const { error } = await supabase
            .from("email_campaigns")
            .delete()
            .eq("id", emailId)
            .eq("user_id", user.id);
          if (error) throw error;
        } else if (email?.is_inbox || email?.event_type === "received") {
          const { error } = await supabase
            .from("inbox_messages")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", emailId)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("email_events")
            .update({ 
              deleted_at: new Date().toISOString(),
              original_event_type: email?.event_type 
            })
            .eq("id", emailId)
            .eq("user_id", user.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, emailIds) => {
      toast.success(
        emailIds.length === 1 ? "Email moved to trash" : `${emailIds.length} emails moved to trash`,
        { duration: 1500 }
      );
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-counts"] });
      setSelectedIds(new Set());
    },
    onError: (error: any) => {
      toast.error("Failed to delete email", { description: error.message });
    },
  });

  const handleDeleteRequest = (emailIds: string[]) => {
    if (skipConfirmation) {
      deleteEmailMutation.mutate(emailIds);
    } else {
      setPendingDeleteIds(emailIds);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_DELETE_CONFIRM_KEY, "true");
      setSkipConfirmation(true);
    }
    deleteEmailMutation.mutate(pendingDeleteIds);
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
    setDontShowAgain(false);
  };

  const handleSingleDelete = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    handleDeleteRequest([emailId]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size > 0) {
      handleDeleteRequest(Array.from(selectedIds));
    }
  };

  const toggleSelection = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map(e => e.id)));
    }
  };

  // Check if email has tracking events
  const getTrackingIndicators = (email: Email) => {
    const events = emailEvents.filter((e: any) => e.resend_email_id === (email as any).resend_email_id);
    const hasOpened = events.some((e: any) => e.event_type === "email.opened" || e.event_type === "opened");
    const hasClicked = events.some((e: any) => e.event_type === "email.clicked" || e.event_type === "clicked");
    return { opened: hasOpened, clicked: hasClicked };
  };

  return (
    <>
      <div className="h-full border-r flex flex-col bg-background">
        {/* Filter Bar */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center gap-1 mb-3">
            {["all", "unread", "replied"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onFilterChange(f)}
                className="text-xs h-7 px-3"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={filteredEmails.length > 0 && selectedIds.size === filteredEmails.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all emails"
              />
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredEmails.length} email${filteredEmails.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={deleteEmailMutation.isPending}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emails found</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => {
                const tracking = getTrackingIndicators(email);
                const displayName = email.is_inbox 
                  ? (email.from_name || email.from_email || email.to_email)
                  : email.to_email;
                
                return (
                  <div
                    key={email.id}
                    onClick={() => onEmailSelect(email.id)}
                    className={cn(
                      "w-full px-3 py-3 text-left hover:bg-muted/50 transition-colors group cursor-pointer",
                      selectedEmailId === email.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={selectedIds.has(email.id)}
                        onCheckedChange={() => {}}
                        onClick={(e) => toggleSelection(e, email.id)}
                        aria-label={`Select email`}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {email.is_read === false && (
                              <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                            )}
                            <span className={cn(
                              "truncate text-sm",
                              email.is_read === false ? "font-semibold" : "font-medium"
                            )}>
                              {displayName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(email.created_at)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleSingleDelete(e, email.id)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className={cn(
                          "text-sm mb-1 truncate",
                          email.is_read === false ? "font-medium text-foreground" : "text-foreground/80"
                        )}>
                          {email.email_subject || "(No subject)"}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Status indicator */}
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {email.is_inbox ? "Received" : email.event_type.replace("email.", "").charAt(0).toUpperCase() + email.event_type.replace("email.", "").slice(1)}
                          </Badge>
                          
                          {/* Tracking indicators */}
                          {!email.is_inbox && (
                            <div className="flex items-center gap-1">
                              {tracking.opened && (
                                <Eye className="h-3 w-3 text-blue-500" />
                              )}
                              {tracking.clicked && (
                                <MousePointer className="h-3 w-3 text-purple-500" />
                              )}
                            </div>
                          )}
                          
                          {/* Reply count */}
                          {(email.reply_count || 0) > 0 && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                              <Mail className="h-2.5 w-2.5 mr-1" />
                              {email.reply_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteIds.length === 1 
                ? "This email will be moved to trash."
                : `${pendingDeleteIds.length} emails will be moved to trash.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Don't show this again
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
