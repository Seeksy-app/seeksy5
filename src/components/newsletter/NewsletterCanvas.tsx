import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NewsletterBlock } from "./types";
import { NewsletterBlockComponent } from "./NewsletterBlock";

interface NewsletterCanvasProps {
  blocks: NewsletterBlock[];
  activeBlockId: string | null;
  onEditBlock: (block: NewsletterBlock) => void;
  onDeleteBlock: (id: string) => void;
  aiAdPlacementEnabled: boolean;
  onAiAdPlacementChange: (enabled: boolean) => void;
  onSuggestAdPlacements: () => void;
}

export function NewsletterCanvas({
  blocks,
  activeBlockId,
  onEditBlock,
  onDeleteBlock,
  aiAdPlacementEnabled,
  onAiAdPlacementChange,
  onSuggestAdPlacements,
}: NewsletterCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'newsletter-canvas',
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* AI Ad Placement Toggle */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Label htmlFor="ai-ads" className="text-sm font-medium">AI Ad Placement</Label>
                <p className="text-xs text-muted-foreground">
                  Let AI suggest optimal ad positions on publish
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="ai-ads"
                checked={aiAdPlacementEnabled}
                onCheckedChange={onAiAdPlacementChange}
              />
              {blocks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSuggestAdPlacements}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggest Now
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Newsletter Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={setNodeRef}
            className={cn(
              "min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors",
              isOver ? "border-primary bg-primary/5" : "border-border",
              blocks.length === 0 && "flex items-center justify-center"
            )}
          >
            {blocks.length === 0 ? (
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">
                  Drag blocks here to build your newsletter
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Choose from content, dynamic, and monetization blocks
                </p>
              </div>
            ) : (
              <SortableContext
                items={blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <NewsletterBlockComponent
                      key={block.id}
                      block={block}
                      onEdit={onEditBlock}
                      onDelete={onDeleteBlock}
                      isActive={block.id === activeBlockId}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
