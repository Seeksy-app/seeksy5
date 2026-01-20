import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Calendar, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ScribeAssistant } from "./ScribeAssistant";

interface CampaignBuilderProps {
  onCampaignCreated?: (campaignId: string) => void;
}

export const CampaignBuilder = ({ onCampaignCreated }: CampaignBuilderProps) => {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scribeOpen, setScribeOpen] = useState(false);
  const [scribeAction, setScribeAction] = useState<"draft" | "rewrite" | "improve_subject" | "check_deliverability">("draft");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["email-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: lists } = useQuery({
    queryKey: ["contact-lists", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("contact_lists")
        .select(`
          *,
          contact_list_members(count)
        `)
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!selectedList || !selectedAccount || !subject) {
        throw new Error("Please fill in required fields (account, list, subject)");
      }

      const { data, error } = await supabase
        .from("email_campaigns")
        .insert({
          campaign_name: subject,
          subject,
          preheader: preheader || null,
          html_content: htmlContent,
          from_email_account_id: selectedAccount,
          recipient_list_id: selectedList,
          status: "draft",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      toast.success("Draft saved successfully");
      if (onCampaignCreated) onCampaignCreated(data.id);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save draft");
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!selectedList || !selectedAccount || !subject || !htmlContent) {
        throw new Error("Please fill in all required fields");
      }

      const scheduledSendAt = scheduledDate && scheduledTime 
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null;

      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: {
          listId: selectedList,
          segmentId: null,
          fromName: "Seeksy",
          fromEmail: selectedAccount,
          subject,
          preheader: preheader || null,
          htmlContent,
          scheduledFor: scheduledSendAt,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
      const sent = data.successCount || 0;
      const suppressed = data.suppressedCount || 0;
      
      if (scheduledDate && scheduledTime) {
        toast.success(`Campaign scheduled for ${format(new Date(`${scheduledDate}T${scheduledTime}`), "MMM d, yyyy 'at' h:mm a")}`);
      } else {
        toast.success(
          `Campaign sent to ${sent} contacts${suppressed > 0 ? ` (${suppressed} suppressed by preferences/unsubscribes)` : ""}`
        );
      }
      setSubject("");
      setPreheader("");
      setHtmlContent("");
      setSelectedList("");
      setScheduledDate("");
      setScheduledTime("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send campaign");
    },
  });

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleScribeApply = (result: any) => {
    if (result.subject) setSubject(result.subject);
    if (result.preheader) setPreheader(result.preheader);
    if (result.body) setHtmlContent(result.body);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Email Campaign</CardTitle>
        <CardDescription>
          Send targeted emails to your contact lists
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>From Email Account</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Select email account" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.email_address} {account.is_default && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To Contact List</Label>
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact list" />
            </SelectTrigger>
            <SelectContent>
              {lists?.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name} ({list.contact_list_members?.[0]?.count || 0} contacts)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Subject</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setScribeAction("improve_subject");
                setScribeOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Improve
            </Button>
          </div>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your email subject"
          />
        </div>

        <div className="space-y-2">
          <Label>Preheader (Optional)</Label>
          <Input
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder="Preview text that appears after subject line"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Shows in inbox preview. {preheader.length}/100 characters
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Message</Label>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setScribeAction("draft");
                  setScribeOpen(true);
                }}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Draft with Scribe
              </Button>
              {htmlContent && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setScribeAction("rewrite");
                      setScribeOpen(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Rewrite
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setScribeAction("check_deliverability");
                      setScribeOpen(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Check
                  </Button>
                </>
              )}
            </div>
          </div>
          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Your email message (HTML supported)"
            rows={8}
          />
        </div>

        <div className="space-y-2">
          <Label>Schedule Send (Optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getTomorrowDate()}
            />
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          {scheduledDate && scheduledTime && (
            <p className="text-xs text-muted-foreground">
              Will send on {format(new Date(`${scheduledDate}T${scheduledTime}`), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => saveDraft.mutate()}
            disabled={saveDraft.isPending || !selectedList || !selectedAccount || !subject}
            variant="outline"
            className="flex-1"
          >
            {saveDraft.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>

          <Button
            onClick={() => sendCampaign.mutate()}
            disabled={sendCampaign.isPending || !selectedList || !selectedAccount || !subject || !htmlContent}
            className="flex-1"
          >
            {sendCampaign.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {scheduledDate ? "Scheduling..." : "Sending..."}
              </>
            ) : (
              <>
                {scheduledDate ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Send
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>

      <ScribeAssistant
        open={scribeOpen}
        onOpenChange={setScribeOpen}
        action={scribeAction}
        initialInput={
          scribeAction === "improve_subject"
            ? subject
            : scribeAction === "draft"
            ? ""
            : htmlContent
        }
        context={{ subject, emailBody: htmlContent }}
        onApply={handleScribeApply}
      />
    </Card>
  );
};
