import { useState, useCallback } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BlockPalette } from "./BlockPalette";
import { NewsletterCanvas } from "./NewsletterCanvas";
import { BlockEditor } from "./BlockEditor";
import { NewsletterBlock, BlockType } from "./types";

interface NewsletterBuilderProps {
  initialBlocks?: NewsletterBlock[];
  onChange?: (blocks: NewsletterBlock[]) => void;
  aiAdPlacementEnabled?: boolean;
  onAiAdPlacementChange?: (enabled: boolean) => void;
}

export function NewsletterBuilder({
  initialBlocks = [],
  onChange,
  aiAdPlacementEnabled = false,
  onAiAdPlacementChange,
}: NewsletterBuilderProps) {
  const [blocks, setBlocks] = useState<NewsletterBlock[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<NewsletterBlock | null>(null);
  const [aiEnabled, setAiEnabled] = useState(aiAdPlacementEnabled);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const generateBlockId = () => {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createNewBlock = (type: BlockType): NewsletterBlock => ({
    id: generateBlockId(),
    type,
    content: type === 'ad-marker' ? { adType: 'cpm', adPlacementType: 'manual' } : {},
    order: blocks.length,
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (!over) return;

    // Check if dragging from palette (creating new block)
    const activeData = active.data.current;
    if (activeData?.fromPalette) {
      const blockType = activeData.type as BlockType;
      const newBlock = createNewBlock(blockType);
      
      // Find position to insert
      const overIndex = blocks.findIndex(b => b.id === over.id);
      const newBlocks = [...blocks];
      
      if (over.id === 'newsletter-canvas' || overIndex === -1) {
        newBlocks.push(newBlock);
      } else {
        newBlocks.splice(overIndex, 0, newBlock);
      }
      
      // Update order
      const orderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
      setBlocks(orderedBlocks);
      onChange?.(orderedBlocks);
      setEditingBlock(newBlock);
      return;
    }

    // Reordering existing blocks
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
          ...b,
          order: i,
        }));
        setBlocks(newBlocks);
        onChange?.(newBlocks);
      }
    }
  };

  const handleEditBlock = (block: NewsletterBlock) => {
    setEditingBlock(block);
  };

  const handleUpdateBlock = (updatedBlock: NewsletterBlock) => {
    const newBlocks = blocks.map(b => 
      b.id === updatedBlock.id ? updatedBlock : b
    );
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id).map((b, i) => ({
      ...b,
      order: i,
    }));
    setBlocks(newBlocks);
    onChange?.(newBlocks);
    if (editingBlock?.id === id) {
      setEditingBlock(null);
    }
  };

  const handleAiAdPlacementChange = (enabled: boolean) => {
    setAiEnabled(enabled);
    onAiAdPlacementChange?.(enabled);
  };

  const handleSuggestAdPlacements = useCallback(() => {
    if (blocks.length < 2) {
      toast.error("Add more content blocks first");
      return;
    }

    // Simple AI suggestion logic - add ad markers at optimal positions
    // In production, this would call an AI service
    const contentBlocks = blocks.filter(b => b.type !== 'ad-marker');
    const existingAdMarkers = blocks.filter(b => b.type === 'ad-marker');
    
    if (existingAdMarkers.length > 0) {
      toast.info("Ad markers already exist. Remove them to get new suggestions.");
      return;
    }

    // Suggest ad placement after every 3-4 content blocks
    const newBlocks: NewsletterBlock[] = [];
    let adCount = 0;
    
    contentBlocks.forEach((block, index) => {
      newBlocks.push(block);
      
      // Add ad marker after every 3rd block (if there are more blocks)
      if ((index + 1) % 3 === 0 && index < contentBlocks.length - 1 && adCount < 3) {
        newBlocks.push({
          id: generateBlockId(),
          type: 'ad-marker',
          content: { 
            adType: 'cpm', 
            adPlacementType: 'ai_suggested',
            adLabel: 'AI-suggested ad placement'
          },
          order: newBlocks.length,
        });
        adCount++;
      }
    });

    // Update order
    const orderedBlocks = newBlocks.map((b, i) => ({ ...b, order: i }));
    setBlocks(orderedBlocks);
    onChange?.(orderedBlocks);
    
    toast.success(`Added ${adCount} AI-suggested ad placements`, {
      description: "You can adjust or remove them as needed",
      icon: <Sparkles className="h-4 w-4" />,
    });
  }, [blocks, onChange]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full">
        {/* Left: Block Palette */}
        <div className="w-64 shrink-0">
          <BlockPalette />
        </div>

        {/* Center: Canvas */}
        <NewsletterCanvas
          blocks={blocks}
          activeBlockId={activeBlockId}
          onEditBlock={handleEditBlock}
          onDeleteBlock={handleDeleteBlock}
          aiAdPlacementEnabled={aiEnabled}
          onAiAdPlacementChange={handleAiAdPlacementChange}
          onSuggestAdPlacements={handleSuggestAdPlacements}
        />

        {/* Right: Block Editor */}
        <div className="w-80 shrink-0">
          {editingBlock ? (
            <BlockEditor
              block={editingBlock}
              onUpdate={handleUpdateBlock}
              onClose={() => setEditingBlock(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Select a block to edit
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
