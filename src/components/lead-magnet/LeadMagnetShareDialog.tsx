import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Link, QrCode, Check } from "lucide-react";
import QRCode from "react-qr-code";

interface LeadMagnetShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadMagnet: {
    title: string;
    slug: string;
  };
}

export function LeadMagnetShareDialog({
  open,
  onOpenChange,
  leadMagnet,
}: LeadMagnetShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  const baseUrl = `${window.location.origin}/${leadMagnet.slug}`;
  
  const buildUtmUrl = () => {
    const params = new URLSearchParams();
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{leadMagnet.title}"</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <Link className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            {/* Simple Link */}
            <div>
              <Label className="text-xs text-muted-foreground">Public URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={baseUrl} readOnly className="text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(baseUrl)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* UTM Builder */}
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">UTM Tracking</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Add tracking parameters for influencer/campaign attribution
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="utm_source" className="text-xs">Source</Label>
                  <Input
                    id="utm_source"
                    placeholder="e.g., instagram, newsletter"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="utm_medium" className="text-xs">Medium</Label>
                  <Input
                    id="utm_medium"
                    placeholder="e.g., social, email"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="utm_campaign" className="text-xs">Campaign</Label>
                  <Input
                    id="utm_campaign"
                    placeholder="e.g., creator_launch_2025"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {(utmSource || utmMedium || utmCampaign) && (
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">Generated URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={buildUtmUrl()} 
                      readOnly 
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(buildUtmUrl())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="pt-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCode value={baseUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan to download "{leadMagnet.title}"
              </p>
              <p className="text-xs text-muted-foreground">
                Great for conferences, live events, and print materials
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
