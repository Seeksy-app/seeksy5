import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Check, 
  Link2, 
  Video, 
  Key, 
  RefreshCw,
  Send,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { OpportunityVideoManager } from "./OpportunityVideoManager";

interface SalesOpportunity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  access_code: string | null;
  status: string;
}

interface OpportunityEditModalProps {
  opportunity: SalesOpportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpportunityEditModal({ opportunity, open, onOpenChange }: OpportunityEditModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");
  const [investorName, setInvestorName] = useState("");
  const queryClient = useQueryClient();

  const shareUrl = `${window.location.origin}/invest/${opportunity.slug}`;

  const generateAccessCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const updateAccessCodeMutation = useMutation({
    mutationFn: async (newCode: string) => {
      const { error } = await (supabase
        .from("sales_opportunities") as any)
        .update({ access_code: newCode })
        .eq("id", opportunity.id);
      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      toast.success("Access code updated");
      queryClient.invalidateQueries({ queryKey: ["board-sales-opportunities"] });
    },
    onError: () => {
      toast.error("Failed to update access code");
    },
  });

  const handleGenerateCode = () => {
    const newCode = generateAccessCode();
    updateAccessCodeMutation.mutate(newCode);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Share link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyAccessCode = () => {
    if (opportunity.access_code) {
      navigator.clipboard.writeText(opportunity.access_code);
      setCopiedCode(true);
      toast.success("Access code copied");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyFullInvite = () => {
    const message = `You've been invited to view ${opportunity.name}.\n\nAccess Link: ${shareUrl}\nAccess Code: ${opportunity.access_code || "No code required"}\n\nPlease keep this information confidential.`;
    navigator.clipboard.writeText(message);
    toast.success("Full invite copied to clipboard");
  };

  const handleSendInvite = () => {
    if (!investorEmail) {
      toast.error("Please enter an email address");
      return;
    }
    // For now, just copy the invite - email sending would go through edge function
    const message = `Hi ${investorName || "there"},\n\nYou've been invited to view ${opportunity.name}.\n\nAccess Link: ${shareUrl}\nAccess Code: ${opportunity.access_code || "No code required"}\n\nPlease keep this information confidential.`;
    navigator.clipboard.writeText(message);
    toast.success("Invite copied! Paste into your email client.");
    setInvestorEmail("");
    setInvestorName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit: {opportunity.name}
            <Badge variant={opportunity.status === "active" ? "default" : "secondary"}>
              {opportunity.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="share" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Access Code
            </TabsTrigger>
          </TabsList>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Share Link</CardTitle>
                <CardDescription>
                  Copy and share this link with investors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm font-mono truncate">
                    {shareUrl}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyShareLink}>
                    {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <Button variant="secondary" className="w-full" onClick={copyFullInvite}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Full Invite (Link + Code)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Send to Specific Investor</CardTitle>
                <CardDescription>
                  Generate a personalized invite for an investor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="investor-name">Investor Name</Label>
                    <Input 
                      id="investor-name"
                      placeholder="John Smith"
                      value={investorName}
                      onChange={(e) => setInvestorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="investor-email">Investor Email</Label>
                    <Input 
                      id="investor-email"
                      type="email"
                      placeholder="investor@example.com"
                      value={investorEmail}
                      onChange={(e) => setInvestorEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSendInvite} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Generate & Copy Invite
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Attached Videos</CardTitle>
                <CardDescription>
                  Select videos to display on this opportunity's investor page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpportunityVideoManager 
                  opportunityId={opportunity.id} 
                  opportunityName={opportunity.name} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Code Tab */}
          <TabsContent value="access" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Access Code</CardTitle>
                <CardDescription>
                  Investors must enter this code to view the opportunity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.access_code ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 rounded-lg bg-muted text-lg font-mono tracking-widest text-center">
                        {opportunity.access_code}
                      </code>
                      <Button variant="outline" size="icon" onClick={copyAccessCode}>
                        {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleGenerateCode}
                      disabled={updateAccessCodeMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate New Code
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Key className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No access code set. Generate one to protect this opportunity.
                    </p>
                    <Button 
                      onClick={handleGenerateCode}
                      disabled={updateAccessCodeMutation.isPending}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Generate Access Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Security Note:</strong> When you generate a new access code, 
                any previously shared codes will no longer work. Make sure to share 
                the new code with your investors.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
