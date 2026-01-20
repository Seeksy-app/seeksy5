import { useSortable } from "@dnd-kit/sortable";
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
  DollarSign,
  GripVertical,
  Trash2,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NewsletterBlock as BlockType, BLOCK_DEFINITIONS } from "./types";

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

interface NewsletterBlockProps {
  block: BlockType;
  onEdit: (block: BlockType) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
}

export function NewsletterBlockComponent({ block, onEdit, onDelete, isActive }: NewsletterBlockProps) {
  const { label, icon } = BLOCK_DEFINITIONS[block.type];
  const Icon = ICONS[icon] || Type;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderBlockPreview = () => {
    switch (block.type) {
      case 'text':
        return (
          <div 
            className={cn(
              "text-sm text-foreground",
              block.content.textAlign === 'center' && 'text-center',
              block.content.textAlign === 'right' && 'text-right'
            )}
          >
            {block.content.text || 'Enter your text here...'}
          </div>
        );
      
      case 'image':
        return block.content.imageUrl ? (
          <img 
            src={block.content.imageUrl} 
            alt={block.content.imageAlt || 'Newsletter image'} 
            className="max-w-full h-auto rounded-md"
          />
        ) : (
          <div className="h-32 bg-muted rounded-md flex items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        );
      
      case 'button':
        return (
          <div className={cn(
            "flex",
            block.content.buttonAlign === 'center' && 'justify-center',
            block.content.buttonAlign === 'right' && 'justify-end'
          )}>
            <Button 
              variant={block.content.buttonStyle === 'outline' ? 'outline' : 'default'}
              className={cn(
                block.content.buttonStyle === 'secondary' && 'bg-secondary text-secondary-foreground'
              )}
            >
              {block.content.buttonText || 'Click Here'}
            </Button>
          </div>
        );
      
      case 'divider':
        return <hr className="border-border my-4" />;
      
      case 'blog-excerpt':
        return (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex gap-4">
              {block.content.blogPostImage && (
                <img src={block.content.blogPostImage} alt="" className="w-24 h-24 object-cover rounded" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{block.content.blogPostTitle || 'Blog Post Title'}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {block.content.blogPostExcerpt || 'Blog post excerpt will appear here...'}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'social-embed':
        return (
          <div className="border rounded-lg p-4 bg-muted/30 text-center">
            <Share2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {block.content.platform || 'Social'} embed
            </p>
          </div>
        );
      
      case 'product-card':
        return (
          <div className="border rounded-lg p-4">
            <div className="flex gap-4">
              {block.content.productImage ? (
                <img src={block.content.productImage} alt="" className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{block.content.productName || 'Product Name'}</h4>
                <p className="text-sm text-muted-foreground">{block.content.productDescription || 'Description'}</p>
                <p className="text-lg font-bold text-primary mt-2">{block.content.productPrice || '$0.00'}</p>
              </div>
            </div>
          </div>
        );
      
      case 'poll':
        return (
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">{block.content.pollQuestion || 'Poll Question?'}</h4>
            <div className="space-y-2">
              {(block.content.pollOptions || ['Option 1', 'Option 2']).map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  <span className="text-sm">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'countdown':
        return (
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              {block.content.countdownLabel || 'Countdown to:'}
            </p>
            <div className="flex justify-center gap-4">
              {['Days', 'Hours', 'Mins', 'Secs'].map(unit => (
                <div key={unit} className="text-center">
                  <div className="text-2xl font-bold text-primary">00</div>
                  <div className="text-xs text-muted-foreground">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'ad-marker':
        return (
          <div className="border-2 border-dashed border-amber-500/50 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-700 dark:text-amber-400">Ad Placement</span>
              </div>
              <div className="flex items-center gap-2">
                {block.content.adPlacementType === 'ai_suggested' && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {block.content.adType || 'CPM'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-2">
              {block.content.adLabel || 'Dynamic ad will appear here when published'}
            </p>
          </div>
        );
      
      default:
        return <div className="p-4 text-muted-foreground">Unknown block type</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-50"
      )}
    >
      <Card className={cn(
        "p-4 transition-all",
        isActive && "ring-2 ring-primary",
        "hover:shadow-md"
      )}>
        {/* Block Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-muted rounded p-1 -ml-1"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(block)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(block.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Block Content Preview */}
        {renderBlockPreview()}
      </Card>
    </div>
  );
}
