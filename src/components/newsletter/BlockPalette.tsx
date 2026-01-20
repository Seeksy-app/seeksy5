import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  Type, 
  Image, 
  MousePointer, 
  Minus, 
  FileText, 
  Share2, 
  ShoppingBag, 
  Vote, 
  Clock, 
  DollarSign 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BlockType, BLOCK_DEFINITIONS } from "./types";

const ICONS: Record<string, React.ElementType> = {
  'Type': Type,
  'Image': Image,
  'MousePointer': MousePointer,
  'Minus': Minus,
  'FileText': FileText,
  'Share2': Share2,
  'ShoppingBag': ShoppingBag,
  'Vote': Vote,
  'Clock': Clock,
  'DollarSign': DollarSign,
};

interface DraggableBlockProps {
  type: BlockType;
}

function DraggableBlock({ type }: DraggableBlockProps) {
  const { label, icon, description } = BLOCK_DEFINITIONS[type];
  const Icon = ICONS[icon] || Type;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-grab",
        "hover:border-primary hover:bg-accent transition-colors",
        isDragging && "opacity-50 cursor-grabbing shadow-lg"
      )}
    >
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  );
}

export function BlockPalette() {
  const contentBlocks: BlockType[] = ['text', 'image', 'button', 'divider'];
  const dynamicBlocks: BlockType[] = ['blog-excerpt', 'social-embed', 'product-card'];
  const interactiveBlocks: BlockType[] = ['poll', 'countdown'];
  const monetizationBlocks: BlockType[] = ['ad-marker'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Blocks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-300px)]">
        {/* Content Blocks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Content</p>
          <div className="space-y-2">
            {contentBlocks.map(type => (
              <DraggableBlock key={type} type={type} />
            ))}
          </div>
        </div>

        {/* Dynamic Blocks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Dynamic</p>
          <div className="space-y-2">
            {dynamicBlocks.map(type => (
              <DraggableBlock key={type} type={type} />
            ))}
          </div>
        </div>

        {/* Interactive Blocks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Interactive</p>
          <div className="space-y-2">
            {interactiveBlocks.map(type => (
              <DraggableBlock key={type} type={type} />
            ))}
          </div>
        </div>

        {/* Monetization Blocks */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" />
              Monetization
            </span>
          </p>
          <div className="space-y-2">
            {monetizationBlocks.map(type => (
              <DraggableBlock key={type} type={type} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
