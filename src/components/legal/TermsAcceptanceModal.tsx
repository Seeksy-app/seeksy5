import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Shield } from "lucide-react";

interface TermsAcceptanceModalProps {
  open: boolean;
  onAccept: () => void;
  userId: string;
}

export function TermsAcceptanceModal({ open, onAccept, userId }: TermsAcceptanceModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsContent, setTermsContent] = useState<string>("");
  const [privacyContent, setPrivacyContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  const loadDocuments = async () => {
    try {
      const result = await (supabase as any)
        .from("legal_templates")
        .select("slug, body_text")
        .in("slug", ["platform-terms", "privacy-policy"]);
      
      const templates = result.data as any[];
      if (templates) {
        const terms = templates.find((t: any) => t.slug === "platform-terms");
        const privacy = templates.find((t: any) => t.slug === "privacy-policy");
        if (terms) setTermsContent(terms.body_text);
        if (privacy) setPrivacyContent(privacy.body_text);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept both Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      // Record both acceptances
      const acceptances = [
        {
          user_id: userId,
          document_type: "platform-terms",
          version_accepted: "v1",
          ip_address: null, // Would be captured server-side
          user_agent: navigator.userAgent,
        },
        {
          user_id: userId,
          document_type: "privacy-policy",
          version_accepted: "v1",
          ip_address: null,
          user_agent: navigator.userAgent,
        },
      ];

      const result = await (supabase as any).from("legal_acceptances").insert(acceptances);
      
      if (result.error) throw result.error;
      
      toast.success("Terms accepted successfully");
      onAccept();
    } catch (err) {
      console.error("Failed to record acceptance:", err);
      toast.error("Failed to record acceptance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Accept Terms & Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Please review and accept our Terms of Service and Privacy Policy to continue.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "terms" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "privacy" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Privacy Policy
          </button>
        </div>

        {/* Document Content */}
        <ScrollArea className="h-[300px] border rounded-lg p-4">
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {activeTab === "terms" ? termsContent : privacyContent}
          </div>
        </ScrollArea>

        {/* Checkboxes */}
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <label htmlFor="terms" className="text-sm cursor-pointer">
              I have read and agree to the <strong>Terms of Service</strong>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
            />
            <label htmlFor="privacy" className="text-sm cursor-pointer">
              I have read and agree to the <strong>Privacy Policy</strong>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={!termsAccepted || !privacyAccepted || loading}
            className="min-w-[120px]"
          >
            {loading ? "Processing..." : "Accept & Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
