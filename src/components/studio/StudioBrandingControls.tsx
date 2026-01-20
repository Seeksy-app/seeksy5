import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ImageUpload";
import { Image, QrCode, Type, Upload } from "lucide-react";

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

interface StudioBrandingControlsProps {
  settings: BrandingSettings;
  onSettingsChange: (settings: BrandingSettings) => void;
  profileImageUrl?: string;
}

export const StudioBrandingControls = ({ 
  settings, 
  onSettingsChange,
  profileImageUrl 
}: StudioBrandingControlsProps) => {
  const updateSetting = <K extends keyof BrandingSettings>(
    key: K, 
    value: BrandingSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Brand Controls
        </CardTitle>
        <CardDescription>
          Customize your on-screen branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image When Camera Off */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show profile photo when camera is off</Label>
            <p className="text-sm text-muted-foreground">
              Display your profile image instead of black screen
            </p>
          </div>
          <Switch
            checked={settings.showProfileWhenCameraOff}
            onCheckedChange={(checked) => updateSetting('showProfileWhenCameraOff', checked)}
            disabled={!profileImageUrl}
          />
        </div>

        {/* Creator Logo */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label>Creator Logo</Label>
            <Switch
              checked={settings.showCreatorLogo}
              onCheckedChange={(checked) => updateSetting('showCreatorLogo', checked)}
            />
          </div>
          {settings.showCreatorLogo && (
            <ImageUpload
              label=""
              currentImage={settings.creatorLogoUrl}
              onImageUploaded={(url) => updateSetting('creatorLogoUrl', url)}
              bucket="event-images"
            />
          )}
        </div>

        {/* Sponsor Logo */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label>Sponsor Logo</Label>
            <Switch
              checked={settings.showSponsorLogo}
              onCheckedChange={(checked) => updateSetting('showSponsorLogo', checked)}
            />
          </div>
          {settings.showSponsorLogo && (
            <ImageUpload
              label=""
              currentImage={settings.sponsorLogoUrl}
              onImageUploaded={(url) => updateSetting('sponsorLogoUrl', url)}
              bucket="event-images"
            />
          )}
        </div>

        {/* QR Code */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Pop-up QR Code
            </Label>
            <Switch
              checked={settings.showQrCode}
              onCheckedChange={(checked) => updateSetting('showQrCode', checked)}
            />
          </div>
          {settings.showQrCode && (
            <ImageUpload
              label="Upload QR Code Image"
              currentImage={settings.qrCodeUrl}
              onImageUploaded={(url) => updateSetting('qrCodeUrl', url)}
              bucket="event-images"
            />
          )}
        </div>

        {/* Lower Third Scroller */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Lower Third Scroller
            </Label>
            <Switch
              checked={settings.showLowerThird}
              onCheckedChange={(checked) => updateSetting('showLowerThird', checked)}
            />
          </div>
          {settings.showLowerThird && (
            <div className="space-y-2">
              <Input
                placeholder="Enter scrolling text..."
                value={settings.lowerThirdText}
                onChange={(e) => updateSetting('lowerThirdText', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This text will scroll across the bottom of your video
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
