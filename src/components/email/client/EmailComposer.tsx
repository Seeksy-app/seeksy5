import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Save, Paperclip } from "lucide-react";

interface ReplyToEmail {
  to_email: string;
  from_email: string;
  email_subject: string;
  html_content?: string;
  created_at: string;
}

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  draftId?: string | null;
  replyTo?: ReplyToEmail | null;
}

interface GmailConnection {
  id: string;
  email: string;
  is_default: boolean;
  signature?: string;
}

export function EmailComposer({ open, onClose, draftId, replyTo }: EmailComposerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Fetch connected Gmail accounts
  const { data: accounts = [] } = useQuery<GmailConnection[]>({
    queryKey: ["gmail-connections"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const result = await (supabase as any)
        .from("gmail_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      
      return (result.data || []) as GmailConnection[];
    },
  });

  // Set default account (prefer is_default=true)
  useEffect(() => {
    if (accounts.length > 0 && !fromAccountId) {
      const defaultAccount = accounts.find((acc: GmailConnection) => acc.is_default) || accounts[0];
      setFromAccountId(defaultAccount.id);
    }
  }, [accounts, fromAccountId]);

  // Load reply data
  useEffect(() => {
    if (replyTo && open) {
      // For reply: send to the original sender (from_email), or to_email if it was an inbox message
      setTo(replyTo.from_email);
      // Add "Re:" prefix if not already present
      const replySubject = replyTo.email_subject.startsWith("Re:") 
        ? replyTo.email_subject 
        : `Re: ${replyTo.email_subject}`;
      setSubject(replySubject);
      
      // Format quoted original message
      const originalDate = new Date(replyTo.created_at).toLocaleString();
      const quotedContent = replyTo.html_content 
        ? `<br/><br/><div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
            <p>On ${originalDate}, ${replyTo.from_email} wrote:</p>
            ${replyTo.html_content}
          </div>`
        : "";
      setBody(quotedContent);
    }
  }, [replyTo, open]);

  // Load draft if editing
  useEffect(() => {
    if (draftId && open && !replyTo) {
      const loadDraft = async () => {
        const result = await (supabase as any)
          .from("email_campaigns")
          .select("*")
          .eq("id", draftId)
          .single();
        
        const draft = result.data as any;
        if (draft && draft.draft_data) {
          const draftData = draft.draft_data as any;
          setFromAccountId(draftData.fromAccountId || accounts[0]?.id || "");
          setTo(draftData.to || "");
          setCc(draftData.cc || "");
          setBcc(draftData.bcc || "");
          setSubject(draft.subject || "");
          setBody(draft.html_content || "");
          if (draftData.cc) setShowCc(true);
          if (draftData.bcc) setShowBcc(true);
        }
      };
      loadDraft();
    }
  }, [draftId, open, accounts, replyTo]);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get signature from selected account
      const selectedAccount = accounts.find((acc: GmailConnection) => acc.id === fromAccountId);
      const signature = selectedAccount?.signature || "";
      
      // Append signature to body if it exists
      const finalBody = signature 
        ? `${body}<br/><br/>---<br/>${signature}`
        : body;

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: to.split(",").map(e => e.trim()),
          cc: cc ? cc.split(",").map(e => e.trim()) : undefined,
          bcc: bcc ? bcc.split(",").map(e => e.trim()) : undefined,
          subject,
          htmlContent: finalBody,
          fromAccountId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Email sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const draftData = {
        fromAccountId,
        to,
        cc,
        bcc,
      };

      if (draftId) {
        // Update existing draft
        const { error } = await (supabase as any)
          .from("email_campaigns")
          .update({
            subject,
            html_content: body,
            draft_data: draftData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draftId);
        
        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await (supabase as any)
          .from("email_campaigns")
          .insert({
            campaign_name: subject || "Untitled Draft",
            subject,
            html_content: body,
            draft_data: draftData,
            is_draft: true,
            draft_status: "draft",
            user_id: user.id,
            from_email_account_id: fromAccountId || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Draft saved" });
      queryClient.invalidateQueries({ queryKey: ["email-drafts"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setShowCc(false);
    setShowBcc(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{replyTo ? "Reply" : "New Email"}</DrawerTitle>
              <DrawerDescription>
                {replyTo ? `Replying to ${replyTo.from_email}` : "Compose and send a 1:1 email"}
              </DrawerDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* From */}
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select email account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account: GmailConnection) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{account.email}</span>
                      {account.is_default && (
                        <span className="text-xs text-muted-foreground ml-2">(default)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              type="email"
              placeholder="recipient@example.com (comma-separated for multiple)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* CC/BCC toggles */}
          <div className="flex gap-2">
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
              >
                Add Cc
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
              >
                Add Bcc
              </Button>
            )}
          </div>

          {/* CC */}
          {showCc && (
            <div className="space-y-2">
              <Label>Cc</Label>
              <Input
                type="email"
                placeholder="cc@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>
          )}

          {/* BCC */}
          {showBcc && (
            <div className="space-y-2">
              <Label>Bcc</Label>
              <Input
                type="email"
                placeholder="bcc@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your email message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px]"
            />
          </div>

          {/* Attachments placeholder */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" disabled>
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments (coming soon)
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 flex items-center justify-between bg-background">
          <div className="flex gap-2">
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={!to || !subject || !body || sendEmailMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraftMutation.mutate()}
              disabled={saveDraftMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
