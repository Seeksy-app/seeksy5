import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareInvestorDialog = ({ open, onOpenChange }: ShareInvestorDialogProps) => {
  const [email, setEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const { data: codeData, error: codeError } = await supabase.rpc('generate_investor_code');
      if (codeError) throw codeError;

      const accessCode = codeData as string;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Get user profile for investor_name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Insert access record in investor_shares table
      const { error: insertError } = await supabase
        .from('investor_shares')
        .insert({
          user_id: user.id,
          investor_email: email,
          investor_name: email.split('@')[0], // Use email username as placeholder
          access_code: accessCode,
          expires_at: expiresAt.toISOString(),
          notes: `Shared by ${profileData?.full_name || 'Admin'}`,
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share with Investors</DialogTitle>
          <DialogDescription>
            Generate a secure access code and link for investors to view your financial forecasts and models
          </DialogDescription>
        </DialogHeader>

        {!generatedCode ? (
          <div className="space-y-4 py-4">
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
              <p className="text-xs text-muted-foreground">
                Share this code with {email}
              </p>
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

            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-semibold">Instructions for investor:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Visit the investor link</li>
                <li>Enter the access code: <span className="font-mono font-bold text-foreground">{generatedCode}</span></li>
                <li>View read-only financial forecasts and models</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Access expires in {expiryDays} days
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};