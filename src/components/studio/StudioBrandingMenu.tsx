import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import ImageUpload from "@/components/ImageUpload";
import { Image, QrCode, Type, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export interface BrandingSettings {
  showProfileWhenCameraOff: boolean;
  showCreatorLogo: boolean;
  creatorLogoUrl: string;
  showSponsorLogo: boolean;
  sponsorLogoUrl: string;
  showQrCode: boolean;
  qrCodeUrl: string;
  showLowerThird: boolean;
  lowerThirdText: string;
}

interface StudioBrandingMenuProps {
  settings: BrandingSettings;
  onSettingsChange: (settings: BrandingSettings) => void;
  profileImageUrl?: string;
}

export const StudioBrandingMenu = ({
  settings,
  onSettingsChange,
  profileImageUrl,
}: StudioBrandingMenuProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [savedQRCodes, setSavedQRCodes] = useState<any[]>([]);
  const [qrCodesLoading, setQrCodesLoading] = useState(false);

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    setQrCodesLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await (supabase as any)
        .from("qr_codes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      setSavedQRCodes((result.data as any[]) || []);
    } catch (error) {
      console.error("Error loading QR codes:", error);
    } finally {
      setQrCodesLoading(false);
    }
  };

  const updateSetting = (key: keyof BrandingSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <Palette className="h-5 w-5" />
          Brand
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[600px] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Brand Controls</h3>
            <p className="text-xs text-muted-foreground">
              Customize your on-screen branding
            </p>
          </div>

          <Separator />

          {/* Profile Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-photo" className="text-sm">
                Profile Photo
              </Label>
              <Switch
                id="profile-photo"
                checked={settings.showProfileWhenCameraOff}
                onCheckedChange={(checked) => updateSetting("showProfileWhenCameraOff", checked)}
                disabled={!profileImageUrl}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Show when camera is off
            </p>
          </div>

          <Separator />

          {/* Creator Logo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="creator-logo" className="text-sm flex items-center gap-2">
                <Image className="h-4 w-4" />
                Creator Logo
              </Label>
              <Switch
                id="creator-logo"
                checked={settings.showCreatorLogo}
                onCheckedChange={(checked) => updateSetting("showCreatorLogo", checked)}
              />
            </div>
            {settings.showCreatorLogo && (
              <ImageUpload
                label=""
                bucket="studio-recordings"
                currentImage={settings.creatorLogoUrl}
                onImageUploaded={(url) => updateSetting("creatorLogoUrl", url)}
              />
            )}
          </div>

          <Separator />

          {/* Sponsor Logo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sponsor-logo" className="text-sm flex items-center gap-2">
                <Image className="h-4 w-4" />
                Sponsor Logo
              </Label>
              <Switch
                id="sponsor-logo"
                checked={settings.showSponsorLogo}
                onCheckedChange={(checked) => updateSetting("showSponsorLogo", checked)}
              />
            </div>
            {settings.showSponsorLogo && (
              <ImageUpload
                label=""
                bucket="studio-recordings"
                currentImage={settings.sponsorLogoUrl}
                onImageUploaded={(url) => updateSetting("sponsorLogoUrl", url)}
              />
            )}
          </div>

          <Separator />

          {/* QR Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="qr-code" className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Pop-up QR Code
              </Label>
              <Switch
                id="qr-code"
                checked={settings.showQrCode}
                onCheckedChange={(checked) => updateSetting("showQrCode", checked)}
              />
            </div>
            {settings.showQrCode && (
              <div className="space-y-2">
                {qrCodesLoading ? (
                  <p className="text-xs text-muted-foreground">Loading QR codes...</p>
                ) : savedQRCodes.length > 0 ? (
                  <>
                    <Label className="text-xs">Select QR Code</Label>
                    <Select
                      value={settings.qrCodeUrl}
                      onValueChange={(value) => updateSetting("qrCodeUrl", value)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Choose a QR code" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedQRCodes.map((qr) => (
                          <SelectItem key={qr.id} value={qr.url}>
                            {qr.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">No QR codes found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => navigate("/qr-codes")}
                    >
                      Create QR Code
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Lower Third */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="lower-third" className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Lower Third
              </Label>
              <Switch
                id="lower-third"
                checked={settings.showLowerThird}
                onCheckedChange={(checked) => updateSetting("showLowerThird", checked)}
              />
            </div>
            {settings.showLowerThird && (
              <Input
                placeholder="Enter scrolling text..."
                value={settings.lowerThirdText}
                onChange={(e) => updateSetting("lowerThirdText", e.target.value)}
                className="h-9 text-xs"
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
