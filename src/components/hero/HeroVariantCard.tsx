import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Image as ImageIcon } from "lucide-react";
import { HeroVariant } from "@/types/hero";

interface HeroVariantCardProps {
  variant: HeroVariant;
  title: string;
  description: string;
  previewImageUrl?: string;
  isGenerating: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  lastGeneratedAt?: string;
}

export function HeroVariantCard({
  variant,
  title,
  description,
  previewImageUrl,
  isGenerating,
  onGenerate,
  onDownload,
  lastGeneratedAt
}: HeroVariantCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewImageUrl && (
          <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
            <img 
              src={previewImageUrl} 
              alt={`${variant} hero preview`} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Hero'
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onDownload}
            disabled={!previewImageUrl}
            title={previewImageUrl ? "Download hero image" : "Generate a hero first"}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {lastGeneratedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Last generated: {new Date(lastGeneratedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
