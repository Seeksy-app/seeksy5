import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Save, Maximize2, Minimize2, Sparkles, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactAutocomplete } from "../ContactAutocomplete";

interface ReplyToEmail {
  to_email: string;
  from_email: string;
  email_subject: string;
  html_content?: string;
  created_at: string;
}

interface FloatingEmailComposerProps {
  open: boolean;
  onClose: () => void;
  draftId?: string | null;
  initialRecipients?: string;
  replyTo?: ReplyToEmail | null;
}

interface EmailAccount {
  id: string;
  email_address: string;
  is_default: boolean;
  is_active: boolean;
}

interface EmailSignature {
  id: string;
  name: string;
  html_signature: string;
  is_active: boolean;
}

export function FloatingEmailComposer({ open, onClose, draftId, initialRecipients, replyTo }: FloatingEmailComposerProps) {
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>("none");

  // Fetch connected email accounts
  const { data: accounts = [] } = useQuery<EmailAccount[]>({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const result = await (supabase as any)
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      return (result.data || []) as EmailAccount[];
    },
  });

  // Fetch user signatures
  const { data: signatures = [] } = useQuery<EmailSignature[]>({
    queryKey: ["email-signatures-composer"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const result = await (supabase as any)
        .from("email_signatures")
        .select("id, name, html_signature, is_active")
        .eq("user_id", user.id)
        .order("is_active", { ascending: false })
        .order("name");
      
      return (result.data || []) as EmailSignature[];
    },
  });

  // Set default account
  useEffect(() => {
    if (accounts.length > 0 && !fromAccountId) {
      const defaultAccount = accounts.find((acc: EmailAccount) => acc.is_default) || accounts[0];
      setFromAccountId(defaultAccount.id);
    }
  }, [accounts, fromAccountId]);

  // Set default signature when signatures load
  useEffect(() => {
    if (signatures.length > 0 && selectedSignatureId === "none") {
      const activeSignature = signatures.find((s: EmailSignature) => s.is_active);
      if (activeSignature) {
        setSelectedSignatureId(activeSignature.id);
      }
    }
  }, [signatures, selectedSignatureId]);

  // Set initial recipients when composer opens
  useEffect(() => {
    if (open && initialRecipients && !to) {
      setTo(initialRecipients);
    }
  }, [open, initialRecipients, to]);

  // Handle reply mode
  useEffect(() => {
    if (replyTo && open) {
      // For reply: send to the original sender
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

  // Auto-save draft every 10 seconds (only if content has changed)
  useEffect(() => {
    if (!open) return;
    // Only auto-save if there's meaningful content
    if (!subject && !body) return;

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      if (subject || body) {
        autoSaveDraftMutation.mutate();
      }
    }, 10000); // Increased from 3s to 10s

    return () => clearTimeout(timer);
  }, [to, subject, body, open]);

  // Load draft if editing
  useEffect(() => {
    if (draftId && open) {
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
  }, [draftId, open, accounts]);

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build final body with signature if selected
      let finalBody = body;
      if (selectedSignatureId && selectedSignatureId !== "none") {
        const selectedSig = signatures.find((s: EmailSignature) => s.id === selectedSignatureId);
        if (selectedSig?.html_signature) {
          // Add spacing (two line breaks) between message and signature
          finalBody = `${body}<br><br>${selectedSig.html_signature}`;
        }
      }

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
      
      // Delete draft after successful send
      if (currentDraftId) {
        await (supabase as any).from("email_campaigns").delete().eq("id", currentDraftId);
      }
      
      return data;
    },
    onSuccess: () => {
      toast({ title: "✅ Email sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      queryClient.invalidateQueries({ queryKey: ["email-drafts"] });
      setCurrentDraftId(null);
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

  // Auto-save mutation (silent, doesn't close composer)
  const autoSaveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const draftData = { fromAccountId, to, cc, bcc };

      if (currentDraftId) {
        const { error } = await (supabase as any)
          .from("email_campaigns")
          .update({
            subject,
            html_content: body,
            draft_data: draftData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentDraftId);
        
        if (error) throw error;
      } else if (to || subject || body) {
        // Only create new draft if there's content
        const result = await (supabase as any)
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
          })
          .select()
          .single();
        
        if (result.error) throw result.error;
        if (result.data) setCurrentDraftId(result.data.id);
      }
    },
    onSuccess: () => {
      // Silent save - no toast, no close
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: () => {
      // Silent failure for auto-save
      setSaveStatus("idle");
    },
  });

  // Manual save mutation (shows toast, closes composer)
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const draftData = { fromAccountId, to, cc, bcc };

      if (draftId) {
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
      toast({ title: "💾 Draft saved" });
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
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
    if (to || subject || body) {
      if (confirm("Save draft before closing?")) {
        saveDraftMutation.mutate();
      } else {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  if (!open) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="shadow-2xl"
          size="lg"
        >
          ✉️ {replyTo ? "Reply" : "New Email"} - {to || "No recipient"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border rounded-xl shadow-2xl flex flex-col transition-all duration-200",
        isFullscreen
          ? "inset-0 m-4"
          : "bottom-4 right-4 w-[680px] h-[720px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{replyTo ? "Reply" : "New Email"}</h3>
          {to && (
            <p className="text-xs text-muted-foreground">To: {to}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* From */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-sm text-muted-foreground">From</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select email account" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-[60]">
              {accounts.map((account: EmailAccount) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{account.email_address}</span>
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
        <div className="flex items-start gap-2">
          <Label className="w-16 text-sm text-muted-foreground pt-2">To</Label>
          <div className="flex-1 flex flex-col gap-2">
            <ContactAutocomplete
              value={to}
              onChange={setTo}
              placeholder="Add recipients (separate with commas for multiple)"
              className="w-full min-h-[40px]"
            />
            <div className="flex gap-1">
              {!showCc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                  className="text-xs h-6"
                >
                  Cc
                </Button>
              )}
              {!showBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                  className="text-xs h-6"
                >
                  Bcc
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-sm text-muted-foreground">Cc</Label>
            <Input
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="flex-1"
            />
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-sm text-muted-foreground">Bcc</Label>
            <Input
              type="email"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="flex-1"
            />
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2">
          <Label className="w-16 text-sm text-muted-foreground">Subject</Label>
          <Input
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Signature selector */}
        {signatures.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="w-16 text-sm text-muted-foreground">Signature</Label>
            <Select value={selectedSignatureId} onValueChange={setSelectedSignatureId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select signature" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[60]">
                <SelectItem value="none">No signature</SelectItem>
                {signatures.map((sig: EmailSignature) => (
                  <SelectItem key={sig.id} value={sig.id}>
                    {sig.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Message</Label>
            <div className="flex items-center gap-2">
              {saveStatus === "saving" && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs text-green-600">Saved</span>
              )}
            </div>
          </div>
          <Textarea
            placeholder="Write your email message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[300px] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-4 flex items-center justify-between bg-muted/30">
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
    </div>
  );
}
