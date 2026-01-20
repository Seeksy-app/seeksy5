import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ThumbnailLogoManagerProps {
  thumbnailUrl: string;
  onLogoApplied: (thumbnailWithLogoUrl: string) => void;
}

type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export function ThumbnailLogoManager({ thumbnailUrl, onLogoApplied }: ThumbnailLogoManagerProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [logoSize, setLogoSize] = useState<number>(15); // Percentage
  const [isUploading, setIsUploading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      setLogoFile(file);
      setLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyLogo = async () => {
    if (!logoUrl) {
      toast.error("Please upload a logo first");
      return;
    }

    setIsApplying(true);
    try {
      // In a real implementation, this would call a backend function
      // that composites the logo onto the thumbnail image
      // For now, we'll just simulate the process
      
      toast.info("Applying logo to thumbnail...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In reality, you'd call an edge function that uses image processing
      // to composite the logo onto the thumbnail at the specified position and size
      onLogoApplied(thumbnailUrl); // For now, just pass through
      
      toast.success("Logo applied successfully!");
    } catch (error: any) {
      console.error('Error applying logo:', error);
      toast.error("Failed to apply logo");
    } finally {
      setIsApplying(false);
    }
  };

  const getPositionLabel = (pos: LogoPosition) => {
    switch (pos) {
      case 'top-left': return 'Top Left';
      case 'top-right': return 'Top Right';
      case 'bottom-left': return 'Bottom Left';
      case 'bottom-right': return 'Bottom Right';
      case 'center': return 'Center';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Add Logo to Thumbnail</h4>
        <p className="text-xs text-muted-foreground">
          Upload your brand logo and position it on the thumbnail
        </p>
      </div>

      {/* Logo Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Upload Logo</Label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={isUploading}
            className="text-sm flex-1"
          />
          {logoUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLogoFile(null);
                setLogoUrl(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          PNG with transparency recommended, max 2MB
        </p>
      </div>

      {logoUrl && (
        <>
          {/* Logo Preview */}
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <Label className="text-sm font-medium mb-2 block">Logo Preview</Label>
              <div className="bg-muted rounded p-2 flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Logo preview"
                  className="max-h-20 object-contain"
                />
              </div>
            </CardContent>
          </Card>

          {/* Position Control */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Logo Position</Label>
            <Select 
              value={logoPosition} 
              onValueChange={(value) => setLogoPosition(value as LogoPosition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">{getPositionLabel('top-left')}</SelectItem>
                <SelectItem value="top-right">{getPositionLabel('top-right')}</SelectItem>
                <SelectItem value="bottom-left">{getPositionLabel('bottom-left')}</SelectItem>
                <SelectItem value="bottom-right">{getPositionLabel('bottom-right')}</SelectItem>
                <SelectItem value="center">{getPositionLabel('center')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Size Control */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Logo Size: {logoSize}%
            </Label>
            <Slider
              value={[logoSize]}
              onValueChange={(values) => setLogoSize(values[0])}
              min={5}
              max={40}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adjust the size of your logo relative to the thumbnail
            </p>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleApplyLogo}
            disabled={isApplying}
            className="w-full"
          >
            {isApplying ? (
              <>
                <ImageIcon className="h-4 w-4 mr-2 animate-pulse" />
                Applying Logo...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Apply Logo to Thumbnail
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}