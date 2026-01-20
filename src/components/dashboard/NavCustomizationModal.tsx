import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GripVertical, Star, Home, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavPreferences, NAV_ITEMS, LANDING_OPTIONS, NavConfig, SubItemConfig } from "@/hooks/useNavPreferences";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { NAVIGATION_CONFIG } from "@/config/navigation";

// Admin-specific nav items derived from NAVIGATION_CONFIG groups (to match actual sidebar order)
const ADMIN_NAV_ITEMS = NAVIGATION_CONFIG.navigation.map((group, idx) => ({
  id: `admin_group_${group.group.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
  label: group.group,
  path: group.items[0]?.path || '/admin',
  isHome: idx === 0, // First group (Dashboard) is the home
}));

const ADMIN_LANDING_OPTIONS = [
  { id: '/admin', label: 'Admin Dashboard', description: 'Platform overview and quick actions' },
  { id: '/cfo/studio-v2', label: 'CFO Studio', description: 'Financial modeling and analysis' },
  { id: '/admin/rd-feeds', label: 'R&D Intelligence', description: 'Research and market insights' },
];

interface SortableNavItemProps {
  item: typeof NAV_ITEMS[0];
  isVisible: boolean;
  isPinned: boolean;
  onToggleVisibility: () => void;
  onTogglePinned: () => void;
  disableHide: boolean;
  hasSubItems?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function SortableNavItem({ 
  item, 
  isVisible, 
  isPinned, 
  onToggleVisibility, 
  onTogglePinned,
  disableHide,
  hasSubItems,
  isExpanded,
  onToggleExpand
}: SortableNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isVisible ? "bg-card border-border" : "bg-muted/30 border-transparent",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </button>
      
      <div className="flex-1 flex items-center gap-2">
        {hasSubItems && onToggleExpand && (
          <button onClick={onToggleExpand} className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}
        {item.isHome && <Home className="h-3 w-3 text-muted-foreground" />}
        <span className={cn(
          "text-sm font-medium",
          isVisible ? "text-foreground" : "text-muted-foreground"
        )}>
          {item.label}
        </span>
        {hasSubItems && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {item.subItems?.length} items
          </span>
        )}
      </div>

      <button
        onClick={onTogglePinned}
        disabled={!isVisible}
        className={cn(
          "p-1 rounded transition-colors",
          isPinned ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground"
        )}
        title={isPinned ? "Unpin from nav" : "Pin to nav"}
      >
        <Star className={cn("h-4 w-4", isPinned && "fill-current")} />
      </button>

      <Switch
        checked={isVisible}
        onCheckedChange={onToggleVisibility}
        disabled={disableHide}
      />
    </div>
  );
}

interface SubItemRowProps {
  subItem: { id: string; label: string; path: string };
  config: SubItemConfig;
  onToggleVisible: () => void;
  onTogglePinned: () => void;
}

function SubItemRow({ subItem, config, onToggleVisible, onTogglePinned }: SubItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 ml-6 border-l-2 border-border/50">
      <span className={cn(
        "flex-1 text-sm",
        config.visible ? "text-foreground" : "text-muted-foreground"
      )}>
        {subItem.label}
      </span>
      <button
        onClick={onTogglePinned}
        disabled={!config.visible}
        className={cn(
          "p-1 rounded transition-colors",
          config.pinned ? "text-amber-500" : "text-muted-foreground/30 hover:text-muted-foreground"
        )}
      >
        <Star className={cn("h-3.5 w-3.5", config.pinned && "fill-current")} />
      </button>
      <Switch
        checked={config.visible}
        onCheckedChange={onToggleVisible}
        className="scale-90"
      />
    </div>
  );
}

export function NavCustomizationModal({ open, onOpenChange }: NavCustomizationModalProps) {
  const { navConfig, adminNavConfig, defaultLandingRoute, savePreferences, resetToDefaults, isLoading } = useNavPreferences();
  const { roles } = useUserRoles();
  
  // Determine if user is admin
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');
  
  // Use appropriate nav items and config based on role
  const activeNavItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const activeLandingOptions = isAdmin ? ADMIN_LANDING_OPTIONS : LANDING_OPTIONS;
  const defaultLanding = isAdmin ? '/admin' : '/my-day';
  const activeConfig = isAdmin ? adminNavConfig : navConfig;
  
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [localHidden, setLocalHidden] = useState<string[]>([]);
  const [localPinned, setLocalPinned] = useState<string[]>([]);
  const [localSubItems, setLocalSubItems] = useState<Record<string, SubItemConfig[]>>({});
  const [localLanding, setLocalLanding] = useState<string>(defaultLanding);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open && !isLoading) {
      // Ensure localOrder includes all current items, preserving stored order for existing items
      const storedOrder = activeConfig.order || [];
      const allItemIds = activeNavItems.map(i => i.id);
      const mergedOrder = [
        ...storedOrder.filter(id => allItemIds.includes(id)),
        ...allItemIds.filter(id => !storedOrder.includes(id))
      ];
      setLocalOrder(mergedOrder);
      setLocalHidden(activeConfig.hidden || []);
      setLocalPinned(activeConfig.pinned || []);
      setLocalLanding(defaultLandingRoute || defaultLanding);
      
      // Initialize sub-items config (only for non-admin, admin nav items don't have sub-items)
      const subItemsConfig: Record<string, SubItemConfig[]> = {};
      if (!isAdmin) {
        NAV_ITEMS.forEach(item => {
          if (item.subItems) {
            subItemsConfig[item.id] = item.subItems.map((sub, idx) => {
              const existing = activeConfig.subItems?.[item.id]?.find(s => s.id === sub.id);
              return existing || { id: sub.id, visible: true, pinned: false, order: idx };
            });
          }
        });
      }
      setLocalSubItems(subItemsConfig);
    }
  }, [open, activeConfig, defaultLandingRoute, isLoading, isAdmin, activeNavItems, defaultLanding]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = (id: string) => {
    const homeItems = activeNavItems.filter(i => i.isHome).map(i => i.id);
    const currentlyVisibleHomes = homeItems.filter(h => !localHidden.includes(h));
    
    if (localHidden.includes(id)) {
      setLocalHidden(prev => prev.filter(h => h !== id));
    } else {
      if (homeItems.includes(id) && currentlyVisibleHomes.length <= 1) {
        toast.error("At least one home page must be visible");
        return;
      }
      setLocalHidden(prev => [...prev, id]);
      setLocalPinned(prev => prev.filter(p => p !== id));
    }
  };

  const togglePinned = (id: string) => {
    if (localPinned.includes(id)) {
      setLocalPinned(prev => prev.filter(p => p !== id));
    } else {
      setLocalPinned(prev => [...prev, id]);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSubItemVisibility = (parentId: string, subItemId: string) => {
    setLocalSubItems(prev => ({
      ...prev,
      [parentId]: prev[parentId].map(s => 
        s.id === subItemId ? { ...s, visible: !s.visible, pinned: s.visible ? false : s.pinned } : s
      )
    }));
  };

  const toggleSubItemPinned = (parentId: string, subItemId: string) => {
    setLocalSubItems(prev => ({
      ...prev,
      [parentId]: prev[parentId].map(s => 
        s.id === subItemId ? { ...s, pinned: !s.pinned } : s
      )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const config: NavConfig = {
        order: localOrder,
        hidden: localHidden,
        pinned: localPinned,
        subItems: localSubItems
      };
      await savePreferences(config, localLanding, isAdmin);
      toast.success("Navigation preferences saved");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetToDefaults(isAdmin);
      toast.success("Reset to defaults");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to reset");
    } finally {
      setIsSaving(false);
    }
  };

  const sortedItems = [...activeNavItems].sort((a, b) => {
    const aIndex = localOrder.indexOf(a.id);
    const bIndex = localOrder.indexOf(b.id);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const homeItems = activeNavItems.filter(i => i.isHome).map(i => i.id);
  const visibleHomes = homeItems.filter(h => !localHidden.includes(h));

  // Items with sub-items for the third tab (only for creator nav, admin nav doesn't have sub-items)
  const itemsWithSubItems = isAdmin ? [] : NAV_ITEMS.filter(item => item.subItems && item.subItems.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Navigation</DialogTitle>
          <DialogDescription>
            Set your startup page and organize your sidebar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="startup" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="startup" className="text-xs">Startup</TabsTrigger>
            <TabsTrigger value="nav" className="text-xs">Nav Items</TabsTrigger>
            <TabsTrigger value="subitems" className="text-xs">Sub-Items</TabsTrigger>
          </TabsList>

          <TabsContent value="startup" className="flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Choose where you land after logging in:
              </p>
              <RadioGroup value={localLanding} onValueChange={setLocalLanding}>
                {activeLandingOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                      localLanding === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setLocalLanding(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="nav" className="flex-1 overflow-y-auto">
            <div className="py-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Drag to reorder. Toggle visibility and pin favorites.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={localOrder} strategy={verticalListSortingStrategy}>
                  {sortedItems.map((item) => (
                    <SortableNavItem
                      key={item.id}
                      item={item as typeof NAV_ITEMS[0]}
                      isVisible={!localHidden.includes(item.id)}
                      isPinned={localPinned.includes(item.id)}
                      onToggleVisibility={() => toggleVisibility(item.id)}
                      onTogglePinned={() => togglePinned(item.id)}
                      disableHide={item.isHome && visibleHomes.length <= 1 && !localHidden.includes(item.id)}
                      hasSubItems={'subItems' in item && !!item.subItems?.length}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </TabsContent>

          <TabsContent value="subitems" className="flex-1 overflow-y-auto">
            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Configure sub-pages for modules with multiple sections.
              </p>
              
              {itemsWithSubItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No modules with sub-items configured.
                </p>
              ) : (
                itemsWithSubItems.map((item) => (
                  <Collapsible
                    key={item.id}
                    open={expandedItems.includes(item.id)}
                    onOpenChange={() => toggleExpanded(item.id)}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      {expandedItems.includes(item.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">
                        {item.subItems?.length} items
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1 space-y-1">
                        {item.subItems?.map((subItem) => {
                          const config = localSubItems[item.id]?.find(s => s.id === subItem.id) 
                            || { id: subItem.id, visible: true, pinned: false, order: 0 };
                          return (
                            <SubItemRow
                              key={subItem.id}
                              subItem={subItem}
                              config={config}
                              onToggleVisible={() => toggleSubItemVisibility(item.id, subItem.id)}
                              onTogglePinned={() => toggleSubItemPinned(item.id, subItem.id)}
                            />
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
