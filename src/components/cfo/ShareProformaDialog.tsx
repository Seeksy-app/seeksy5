import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Mail, FileSpreadsheet, TrendingUp, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareProformaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proformaType: 'ai' | 'custom';
}

export const ShareProformaDialog = ({ open, onOpenChange, proformaType }: ShareProformaDialogProps) => {
  const [email, setEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Share configuration
  const [adjustmentPercent, setAdjustmentPercent] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [allowHtmlView, setAllowHtmlView] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [useRealTimeData, setUseRealTimeData] = useState(true);

  const generateAccessCode = async () => {
    if (!email) {
      toast.error("Please enter an investor email address");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to share access");
        return;
      }

      // Generate unique access code
      const { data: codeData, error: codeError } = await (supabase as any).rpc('generate_investor_code');
      if (codeError) throw codeError;

      const accessCode = codeData as unknown as string;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Calculate adjustment multiplier
      const adjustmentMultiplier = adjustmentType === 'increase' 
        ? 1 + (adjustmentPercent / 100)
        : 1 - (adjustmentPercent / 100);

      // Store share configuration
      // IMPORTANT: When sharing Custom Pro Forma, we ALWAYS use AI data as the source
      // - 0% adjustment = exact copy of AI Pro Forma
      // - Non-zero adjustment = AI Pro Forma data with adjustment applied
      const shareConfig = {
        proformaType: proformaType,
        sourceData: 'ai', // Always use AI Pro Forma as the source for adjustments
        adjustmentMultiplier: adjustmentPercent !== 0 ? adjustmentMultiplier : 1,
        adjustmentPercent,
        adjustmentType,
        allowHtmlView,
        allowDownload,
        useRealTimeData,
        copyFromAI: adjustmentPercent === 0, // Flag to indicate exact AI copy when 0%
      };

      // Insert access record with share configuration
      const { error: insertError } = await supabase
        .from('investor_shares')
        .insert({
          user_id: user.id,
          investor_email: email,
          investor_name: email.split('@')[0],
          access_code: accessCode,
          expires_at: expiresAt.toISOString(),
          notes: `Shared by ${profileData?.full_name || 'Admin'} - ${proformaType === 'ai' ? 'AI' : 'Custom'} Proforma${adjustmentPercent !== 0 ? ' with ' + adjustmentType + ' ' + adjustmentPercent + '% (all scenarios)' : ''} - ${useRealTimeData ? 'Real-time data' : 'Projected data'}`,
          share_config: shareConfig,
        });

      if (insertError) throw insertError;

      // Generate shareable link
      const baseUrl = window.location.origin;
      const investorLink = `${baseUrl}/investor?code=${accessCode}`;

      setGeneratedCode(accessCode);
      setGeneratedLink(investorLink);

      toast.success("Investor access created successfully!");
    } catch (error: any) {
      console.error("Error generating access:", error);
      toast.error(error.message || "Failed to generate access code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const sendEmail = async () => {
    if (!generatedCode || !generatedLink || !email) {
      toast.error("Missing required information");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.functions.invoke("send-investor-invite", {
        body: {
          investorEmail: email,
          investorName: email.split('@')[0],
          accessCode: generatedCode,
          investorLink: generatedLink,
          senderName: profileData?.full_name || undefined,
          senderUserId: user.id,
        },
      });

      if (error) throw error;

      toast.success(`Investor access email sent to ${email}`);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setGeneratedCode(null);
    setGeneratedLink(null);
    setAdjustmentPercent(0);
    setAdjustmentType('increase');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Share With Investors (External)
            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
              <ExternalLink className="h-3 w-3 mr-1" />
              EXTERNAL ACCESS
            </Badge>
          </DialogTitle>
          <DialogDescription>
            For investors only — not for internal Board users. Generate secure access with customizable view options.
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-6 py-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced">Share Options</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Investor Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="investor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Access Duration (days)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    min="1"
                    max="365"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Access will expire after {expiryDays} days
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {!useRealTimeData && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Overall Adjustment (All Scenarios)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Apply +/- % adjustment to Conservative, Growth, and Aggressive projections
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="increase">+</SelectItem>
                              <SelectItem value="decrease">−</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={adjustmentPercent}
                            onChange={(e) => setAdjustmentPercent(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="flex-1"
                          />
                          <span className="flex items-center text-sm text-muted-foreground font-medium">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          0% = Exact copy of AI Pro Forma. -10% = AI data reduced by 10%. +10% = AI data increased by 10%. Applies to all scenarios.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="real-time" className="text-sm font-medium">
                        Use Real-Time Financials
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Show live data from your actual system metrics
                      </p>
                    </div>
                    <Switch
                      id="real-time"
                      checked={useRealTimeData}
                      onCheckedChange={setUseRealTimeData}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="html-view" className="text-sm font-medium">
                        Allow HTML Spreadsheet View
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Investors can view spreadsheet in browser (read-only)
                      </p>
                    </div>
                    <Switch
                      id="html-view"
                      checked={allowHtmlView}
                      onCheckedChange={setAllowHtmlView}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="download" className="text-sm font-medium">
                        Allow Download
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Investors can download Excel/PDF files
                      </p>
                    </div>
                    <Switch
                      id="download"
                      checked={allowDownload}
                      onCheckedChange={setAllowDownload}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={generateAccessCode} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Access Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Access Code</Label>
              <div className="flex gap-2">
                <Input value={generatedCode} readOnly className="font-mono text-lg" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Investor Link</Label>
              <div className="flex gap-2">
                <Input value={generatedLink || ""} readOnly className="text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatedLink || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={sendEmail} variant="default" className="flex-1" disabled={loading}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Sending..." : "Send Email"}
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Done
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm space-y-3">
              <p className="font-semibold">Share Configuration:</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• Proforma: {proformaType === 'ai' ? 'AI-Generated' : 'Custom'}</li>
                <li>• Source Data: AI Pro Forma {adjustmentPercent === 0 ? '(exact copy)' : `with ${adjustmentType === 'increase' ? '+' : '−'}${adjustmentPercent}% adjustment`}</li>
                <li>• Adjustment: {adjustmentPercent !== 0 ? `${adjustmentType === 'increase' ? '+' : '−'}${adjustmentPercent}% applied to all scenarios (Conservative, Growth, Aggressive)` : 'None - exact copy of AI data'}</li>
                <li>• Data: {useRealTimeData ? 'Real-time metrics' : 'Projected assumptions'}</li>
                <li>• View: {allowHtmlView ? 'HTML spreadsheet enabled' : 'View-only mode'}</li>
                <li>• Download: {allowDownload ? 'Enabled' : 'Disabled'}</li>
                <li>• Expires: {expiryDays} days</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
