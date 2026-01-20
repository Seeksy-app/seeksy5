import { useRef } from "react";
import QRCodeSVG from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileQRCodeProps {
  username: string;
  themeColor?: string;
  logoUrl?: string;
  shape?: 'square' | 'round';
}

export const ProfileQRCode = ({ username, themeColor = "#0064B1", logoUrl, shape = 'square' }: ProfileQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const profileUrl = `${window.location.origin}/${username}`;

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Add logo if provided
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const logoSize = canvas.width * 0.2; // 20% of canvas size
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;
          
          // Draw white background circle for logo
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2 + 10, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
          
          finishDownload();
        };
        logoImg.src = logoUrl;
      } else {
        finishDownload();
      }

      function finishDownload() {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${username}-qr-code.png`;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: "QR Code downloaded",
            description: "Your QR code has been saved as an image.",
          });
        });
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Profile",
          text: `Check out my profile: ${profileUrl}`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied",
        description: "Profile URL copied to clipboard.",
      });
    }
  };

  return (
    <div className="inline-flex flex-col items-center">
      <div 
        ref={qrRef} 
        className="inline-flex items-center justify-center p-0 overflow-hidden bg-transparent"
        style={shape === 'round' ? { 
          borderRadius: '50%', 
          width: '200px', 
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        } : {}}
      >
        <QRCodeSVG
          value={profileUrl}
          size={shape === 'round' ? 140 : 200}
          level="H"
          fgColor={themeColor}
          bgColor="transparent"
        />
      </div>
      
      <div className="text-sm text-muted-foreground mt-2">
        <p className="font-mono text-xs break-all text-center">{profileUrl}</p>
      </div>
    </div>
  );
};
