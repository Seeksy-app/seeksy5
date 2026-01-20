import { cn } from "@/lib/utils";
import { BrandingSettings } from "./StudioBrandingControls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "./scroller.css";

interface StudioBrandingOverlayProps {
  settings: BrandingSettings;
  cameraEnabled: boolean;
  profileImageUrl?: string;
  userName?: string;
}

export const StudioBrandingOverlay = ({ 
  settings, 
  cameraEnabled,
  profileImageUrl,
  userName
}: StudioBrandingOverlayProps) => {
  return (
    <>
      {/* Profile Image When Camera Off */}
      {!cameraEnabled && settings.showProfileWhenCameraOff && profileImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90">
          <div className="text-center space-y-4">
            <Avatar className="h-48 w-48 mx-auto ring-4 ring-primary/20">
              <AvatarImage src={profileImageUrl} alt={userName} />
              <AvatarFallback className="text-6xl">
                {userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {userName && (
              <p className="text-2xl font-semibold text-foreground">{userName}</p>
            )}
          </div>
        </div>
      )}

      {/* Creator Logo - Top Left */}
      {settings.showCreatorLogo && settings.creatorLogoUrl && (
        <div className="absolute top-12 left-12 z-10">
          <img 
            src={settings.creatorLogoUrl} 
            alt="Creator Logo" 
            className="h-20 w-auto max-w-[240px] object-contain drop-shadow-lg"
          />
        </div>
      )}

      {/* Sponsor Logo - Top Right */}
      {settings.showSponsorLogo && settings.sponsorLogoUrl && (
        <div className="absolute top-12 right-12 z-10">
          <img 
            src={settings.sponsorLogoUrl} 
            alt="Sponsor Logo" 
            className="h-20 w-auto max-w-[240px] object-contain drop-shadow-lg"
          />
        </div>
      )}

      {/* QR Code - Bottom Right Corner */}
      {settings.showQrCode && settings.qrCodeUrl && (
        <div className="absolute bottom-6 right-6 z-10 bg-white p-2.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-5 duration-500">
          <img 
            src={settings.qrCodeUrl} 
            alt="QR Code" 
            className="h-28 w-28 object-contain"
          />
          <p className="text-xs text-center text-gray-700 font-medium mt-1.5">Scan to connect</p>
        </div>
      )}

      {/* Lower Third Scroller */}
      {settings.showLowerThird && settings.lowerThirdText && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground py-3 shadow-lg overflow-hidden">
          <div className="scroller-text">
            <span>{settings.lowerThirdText}</span>
            <span>{settings.lowerThirdText}</span>
            <span>{settings.lowerThirdText}</span>
          </div>
        </div>
      )}
    </>
  );
};
