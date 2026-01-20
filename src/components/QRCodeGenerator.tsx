import { useRef } from "react";
import QRCodeSVG from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  url: string;
  title: string;
  filename?: string;
  themeColor?: string;
  onSave?: () => void;
}

export const QRCodeGenerator = ({ 
  url, 
  title, 
  filename = "qr-code",
  themeColor = "#0064B1",
  onSave
}: QRCodeGeneratorProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.png`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "QR Code downloaded",
          description: "Your QR code has been saved as an image.",
        });
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out: ${title}`,
          url: url,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "URL copied to clipboard.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div 
          ref={qrRef} 
          className="flex justify-center p-6 bg-white rounded-lg"
        >
          <QRCodeSVG
            value={url}
            size={256}
            level="H"
            fgColor={themeColor}
          />
        </div>
        
        <div className="text-sm text-center space-y-2">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground font-mono text-xs break-all">
            {url}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
        
        {onSave && (
          <Button
            onClick={onSave}
            className="w-full"
          >
            Save QR Code
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
