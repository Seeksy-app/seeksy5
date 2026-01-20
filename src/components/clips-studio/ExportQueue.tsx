import { useState } from "react";
import { ClipData } from "@/pages/ClipsStudio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  X, Smartphone, Monitor, Square, RectangleHorizontal, 
  Trash2, Share2, Shield, Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueuedClip {
  clipId: string;
  clipTitle: string;
  format: string;
  thumbnailUrl?: string;
}

interface ExportQueueProps {
  queuedClips: QueuedClip[];
  onRemoveFromQueue: (clipId: string, format: string) => void;
  onClearQueue: () => void;
  onPublish: () => void;
  enableCertification: boolean;
  onCertificationChange: (enabled: boolean) => void;
}

const formatIcons: Record<string, React.ElementType> = {
  "9:16": Smartphone,
  "1:1": Square,
  "16:9": Monitor,
  "4:5": RectangleHorizontal,
};

const formatColors: Record<string, string> = {
  "9:16": "bg-pink-500",
  "1:1": "bg-purple-500",
  "16:9": "bg-blue-500",
  "4:5": "bg-orange-500",
};

export function ExportQueue({
  queuedClips,
  onRemoveFromQueue,
  onClearQueue,
  onPublish,
  enableCertification,
  onCertificationChange,
}: ExportQueueProps) {
  // Group clips by format for summary
  const formatCounts = queuedClips.reduce((acc, clip) => {
    acc[clip.format] = (acc[clip.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-shrink-0 border-t bg-card/95 backdrop-blur-sm">
      {/* Queue header - always visible */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Export Queue</h3>
          <Badge className={cn(
            "text-white",
            queuedClips.length > 0 ? "bg-[#2C6BED]" : "bg-muted-foreground/50"
          )}>
            {queuedClips.length} clip{queuedClips.length !== 1 ? 's' : ''}
          </Badge>
          {queuedClips.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              {Object.entries(formatCounts).map(([format, count]) => {
                const Icon = formatIcons[format] || Square;
                return (
                  <Badge key={format} variant="outline" className="gap-1 text-xs">
                    <Icon className="h-3 w-3" />
                    {format}: {count}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Certification toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="certification"
              checked={enableCertification}
              onCheckedChange={onCertificationChange}
            />
            <Label htmlFor="certification" className="text-xs flex items-center gap-1 cursor-pointer">
              <Shield className="h-3 w-3 text-[#2C6BED]" />
              Blockchain Certification
            </Label>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearQueue} 
            className="text-xs text-muted-foreground"
            disabled={queuedClips.length === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All
          </Button>
          
          <Button 
            size="sm" 
            className="bg-[#053877] hover:bg-[#053877]/90"
            onClick={onPublish}
            disabled={queuedClips.length === 0}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Publish {queuedClips.length > 0 ? `${queuedClips.length} Clip${queuedClips.length !== 1 ? 's' : ''}` : 'Clips'}
          </Button>
        </div>
      </div>

      {/* Horizontal scrollable queue or placeholder */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-3 p-3 min-h-[80px]">
          {queuedClips.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 opacity-40" />
                  <Square className="h-5 w-5 opacity-40" />
                  <Monitor className="h-5 w-5 opacity-40" />
                  <RectangleHorizontal className="h-5 w-5 opacity-40" />
                </div>
                <span className="text-sm">Select aspect ratios and add clips to the export queue</span>
              </div>
            </div>
          ) : (
            queuedClips.map((item, index) => {
              const Icon = formatIcons[item.format] || Square;
              return (
                <div
                  key={`${item.clipId}-${item.format}-${index}`}
                  className="flex-shrink-0 relative group"
                >
                  <div className="w-28 rounded-lg border bg-background overflow-hidden">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-muted relative">
                      {item.thumbnailUrl ? (
                        <img 
                          src={item.thumbnailUrl} 
                          alt={item.clipTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Format badge */}
                      <Badge 
                        className={cn(
                          "absolute bottom-1 right-1 text-[10px] px-1 py-0 text-white border-0",
                          formatColors[item.format] || "bg-gray-500"
                        )}
                      >
                        {item.format}
                      </Badge>

                      {/* Remove button */}
                      <button
                        onClick={() => onRemoveFromQueue(item.clipId, item.format)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Title */}
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium truncate">{item.clipTitle}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
