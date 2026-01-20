import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  FolderOpen,
  AlertCircle,
  Save,
  X,
  Check,
} from "lucide-react";
import { useModuleGroups, useModuleGroupMutations, GroupWithModules } from "@/hooks/useModuleGroups";
import { SEEKSY_MODULES, SeeksyModule } from "@/components/modules/moduleData";
import { cn } from "@/lib/utils";

// Sortable Group Item
function SortableGroupItem({
  group,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  group: GroupWithModules;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent border-border",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
    >
      <button {...attributes} {...listeners} className="cursor-grab hover:text-primary">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{group.label}</p>
        <p className="text-xs text-muted-foreground">
          {group.primaryModules.length} primary, {group.associatedModules.length} associated
        </p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {!group.is_system && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Draggable Module Item
function DraggableModuleItem({
  module,
  showGroup,
  onRemove,
}: {
  module: SeeksyModule;
  showGroup?: string;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = module.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{module.name}</p>
        {showGroup && <p className="text-xs text-muted-foreground">{showGroup}</p>}
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// Drop Zone
function ModuleDropZone({
  title,
  moduleKeys,
  onDrop,
  onRemove,
}: {
  title: string;
  moduleKeys: string[];
  onDrop: (moduleKey: string) => void;
  onRemove: (moduleKey: string) => void;
}) {
  const modules = moduleKeys
    .map((key) => SEEKSY_MODULES.find((m) => m.id === key))
    .filter(Boolean) as SeeksyModule[];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="min-h-[60px] p-2 rounded-lg border-2 border-dashed border-border bg-muted/30 space-y-1.5">
        <SortableContext items={moduleKeys} strategy={verticalListSortingStrategy}>
          {modules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Drag modules here
            </p>
          ) : (
            modules.map((module) => (
              <DraggableModuleItem
                key={module.id}
                module={module}
                onRemove={() => onRemove(module.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ModuleOrganizer() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupWithModules | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupWithModules | null>(null);
  const [newGroupForm, setNewGroupForm] = useState({ label: "", key: "", description: "", icon: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localGroups, setLocalGroups] = useState<GroupWithModules[]>([]);
  const [moduleFilter, setModuleFilter] = useState<"all" | "unassigned">("all");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading, refetch } = useModuleGroups();
  const {
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    bulkSaveAssignments,
  } = useModuleGroupMutations();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = roles?.some((r) => r.role === "admin" || r.role === "super_admin");
      if (!isAdmin) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/admin");
        return;
      }
      setHasAccess(true);
      setLoading(false);
    };
    checkAccess();
  }, [navigate]);

  // Sync local state with fetched groups
  useEffect(() => {
    if (groups) {
      setLocalGroups(groups);
      if (!selectedGroupId && groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    }
  }, [groups]);

  const selectedGroup = localGroups.find((g) => g.id === selectedGroupId);

  // Get all assigned module keys
  const assignedModuleKeys = new Set(
    localGroups.flatMap((g) => [...g.primaryModules.map((m) => m.module_key), ...g.associatedModules.map((m) => m.module_key)])
  );

  // Filtered modules for palette
  const paletteModules = SEEKSY_MODULES.filter((m) => {
    if (moduleFilter === "unassigned") return !assignedModuleKeys.has(m.id);
    return true;
  });

  // Handle group reorder
  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalGroups((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((g, i) => ({
        ...g,
        sort_order: i,
      }));
      return reordered;
    });
    setHasUnsavedChanges(true);
  };

  // Handle module drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveModuleId(event.active.id as string);
  };

  // Add module to group
  const addModuleToSelectedGroup = (moduleKey: string, type: "primary" | "associated") => {
    if (!selectedGroup) return;

    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g.id !== selectedGroupId) return g;

        const newModule = {
          id: `temp-${Date.now()}-${moduleKey}`,
          group_id: g.id,
          module_key: moduleKey,
          relationship_type: type,
          sort_order:
            type === "primary"
              ? g.primaryModules.length
              : g.associatedModules.length,
        };

        return {
          ...g,
          primaryModules:
            type === "primary"
              ? [...g.primaryModules, newModule]
              : g.primaryModules,
          associatedModules:
            type === "associated"
              ? [...g.associatedModules, newModule]
              : g.associatedModules,
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Remove module from group
  const removeModuleFromGroup = (moduleKey: string) => {
    if (!selectedGroup) return;

    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g.id !== selectedGroupId) return g;
        return {
          ...g,
          primaryModules: g.primaryModules.filter((m) => m.module_key !== moduleKey),
          associatedModules: g.associatedModules.filter((m) => m.module_key !== moduleKey),
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupForm.label || !newGroupForm.key) {
      toast.error("Label and key are required");
      return;
    }

    const maxOrder = Math.max(...localGroups.map((g) => g.sort_order), 0);

    try {
      await createGroup.mutateAsync({
        label: newGroupForm.label,
        key: newGroupForm.key.toLowerCase().replace(/\s+/g, "-"),
        description: newGroupForm.description || null,
        icon: newGroupForm.icon || null,
        sort_order: maxOrder + 1,
        is_system: false,
      });
      toast.success("Group created");
      setShowNewGroupDialog(false);
      setNewGroupForm({ label: "", key: "", description: "", icon: "" });
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      await updateGroup.mutateAsync({
        id: editingGroup.id,
        label: editingGroup.label,
        description: editingGroup.description,
        icon: editingGroup.icon,
      });
      toast.success("Group updated");
      setShowEditGroupDialog(false);
      setEditingGroup(null);
    } catch (error) {
      toast.error("Failed to update group");
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroup.mutateAsync(groupToDelete.id);
      toast.success("Group deleted");
      setShowDeleteDialog(false);
      setGroupToDelete(null);
      if (selectedGroupId === groupToDelete.id) {
        setSelectedGroupId(localGroups.find((g) => g.id !== groupToDelete.id)?.id || null);
      }
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // Save group order
      await reorderGroups.mutateAsync(
        localGroups.map((g) => ({ id: g.id, sort_order: g.sort_order }))
      );

      // Save module assignments
      const allAssignments = localGroups.flatMap((g) => [
        ...g.primaryModules.map((m, i) => ({
          groupId: g.id,
          moduleKey: m.module_key,
          relationshipType: "primary" as const,
          sortOrder: i,
        })),
        ...g.associatedModules.map((m, i) => ({
          groupId: g.id,
          moduleKey: m.module_key,
          relationshipType: "associated" as const,
          sortOrder: i,
        })),
      ]);

      await bulkSaveAssignments.mutateAsync(allAssignments);

      toast.success("Changes saved successfully");
      setHasUnsavedChanges(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (groups) {
      setLocalGroups(groups);
    }
    setHasUnsavedChanges(false);
  };

  if (loading || groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Organizer</h1>
          <p className="text-muted-foreground mt-1">
            Configure how modules are grouped in the sidebar and Module Center
          </p>
        </div>
        <Badge variant="outline" className="text-xs">Admin Only</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_350px]">
        {/* Left Column - Groups */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Groups</CardTitle>
              <Button size="sm" onClick={() => setShowNewGroupDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={localGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                {localGroups.map((group) => (
                  <SortableGroupItem
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupId === group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    onEdit={() => {
                      setEditingGroup(group);
                      setShowEditGroupDialog(true);
                    }}
                    onDelete={() => {
                      setGroupToDelete(group);
                      setShowDeleteDialog(true);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Middle Column - Module Palette */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modules</CardTitle>
              <Tabs value={moduleFilter} onValueChange={(v) => setModuleFilter(v as typeof moduleFilter)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                  <TabsTrigger value="unassigned" className="text-xs px-3">Unassigned</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              Click a module to add it to the selected group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {paletteModules.map((module) => {
                  const Icon = module.icon;
                  const isAssigned = assignedModuleKeys.has(module.id);

                    // Check if module is already in the SELECTED group
                    const isInSelectedGroup = selectedGroup && (
                      selectedGroup.primaryModules.some((m) => m.module_key === module.id) ||
                      selectedGroup.associatedModules.some((m) => m.module_key === module.id)
                    );

                    // Get all groups this module is in
                    const assignedGroups = localGroups.filter(
                      (g) =>
                        g.primaryModules.some((m) => m.module_key === module.id) ||
                        g.associatedModules.some((m) => m.module_key === module.id)
                    );

                    return (
                      <div
                        key={module.id}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer",
                          isInSelectedGroup
                            ? "bg-primary/10 border-primary/30"
                            : isAssigned
                            ? "bg-card hover:bg-accent border-border"
                            : "bg-card hover:bg-accent border-border"
                        )}
                        onClick={() => {
                          // Allow adding to selected group even if in other groups
                          if (!isInSelectedGroup && selectedGroup) {
                            addModuleToSelectedGroup(module.id, "primary");
                          }
                        }}
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{module.name}</p>
                          {assignedGroups.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              In: {assignedGroups.map(g => g.label).join(', ')}
                            </p>
                          )}
                        </div>
                        {selectedGroup && (
                          <div className="flex gap-1">
                            {isInSelectedGroup ? (
                              <Badge variant="secondary" className="text-xs">Added</Badge>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addModuleToSelectedGroup(module.id, "primary");
                                  }}
                                >
                                  Primary
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addModuleToSelectedGroup(module.id, "associated");
                                  }}
                                >
                                  Assoc.
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column - Group Detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedGroup ? selectedGroup.label : "Select a Group"}
            </CardTitle>
            {selectedGroup?.description && (
              <CardDescription>{selectedGroup.description}</CardDescription>
            )}
          </CardHeader>
          {selectedGroup ? (
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <ModuleDropZone
                  title="Primary Modules (Sidebar)"
                  moduleKeys={selectedGroup.primaryModules.map((m) => m.module_key)}
                  onDrop={(key) => addModuleToSelectedGroup(key, "primary")}
                  onRemove={removeModuleFromGroup}
                />
                <Separator />
                <ModuleDropZone
                  title="Associated Modules (Badges/Tooltips)"
                  moduleKeys={selectedGroup.associatedModules.map((m) => m.module_key)}
                  onDrop={(key) => addModuleToSelectedGroup(key, "associated")}
                  onRemove={removeModuleFromGroup}
                />
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a group from the left to manage its modules</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Unsaved Changes Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDiscardChanges}>
                <X className="h-4 w-4 mr-1" /> Discard
              </Button>
              <Button onClick={handleSaveChanges} disabled={bulkSaveAssignments.isPending}>
                {bulkSaveAssignments.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Dialog */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g., Creator Studio"
                value={newGroupForm.label}
                onChange={(e) =>
                  setNewGroupForm({
                    ...newGroupForm,
                    label: e.target.value,
                    key: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Key (slug)</Label>
              <Input
                placeholder="e.g., creator-studio"
                value={newGroupForm.key}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description"
                value={newGroupForm.description}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (optional)</Label>
              <Input
                placeholder="e.g., Video"
                value={newGroupForm.icon}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, icon: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={createGroup.isPending}>
              {createGroup.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditGroupDialog} onOpenChange={setShowEditGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editingGroup.label}
                  onChange={(e) => setEditingGroup({ ...editingGroup, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingGroup.description || ""}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={editingGroup.icon || ""}
                  onChange={(e) => setEditingGroup({ ...editingGroup, icon: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={updateGroup.isPending}>
              {updateGroup.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{groupToDelete?.label}" and move all its modules to Unassigned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
