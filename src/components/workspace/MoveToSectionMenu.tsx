import { useState } from "react";
import { Check, ChevronRight, FolderOpen } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useModuleGroups } from "@/hooks/useModuleGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MoveToSectionMenuProps {
  moduleId: string;
  moduleName: string;
  currentGroupKey?: string;
  onMoved?: () => void;
}

export function MoveToSectionMenu({ 
  moduleId, 
  moduleName,
  currentGroupKey,
  onMoved 
}: MoveToSectionMenuProps) {
  const { data: moduleGroups, isLoading } = useModuleGroups();
  const [isMoving, setIsMoving] = useState(false);

  const handleMoveToSection = async (groupKey: string, groupLabel: string) => {
    if (isMoving) return;
    setIsMoving(true);

    try {
      // Get the group ID from the key
      const targetGroup = moduleGroups?.find(g => g.key === groupKey);
      if (!targetGroup) {
        throw new Error("Section not found");
      }

      // Check if module is already in this group
      const isAlreadyInGroup = [...targetGroup.primaryModules, ...targetGroup.associatedModules]
        .some(m => m.module_key === moduleId);

      if (isAlreadyInGroup) {
        toast.info(`${moduleName} is already in ${groupLabel}`);
        return;
      }

      // Add module to the target group as associated
      const result = await (supabase as any)
        .from('module_group_modules')
        .upsert({
          group_id: targetGroup.id,
          module_key: moduleId,
          relationship_type: 'associated',
          sort_order: targetGroup.associatedModules.length,
        }, {
          onConflict: 'group_id,module_key,relationship_type'
        });

      if (result.error) throw result.error;

      toast.success(`Moved ${moduleName} to ${groupLabel}`);
      onMoved?.();
    } catch (error) {
      console.error("Failed to move module:", error);
      toast.error("Failed to move module");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer">
        <FolderOpen className="h-4 w-4 mr-2" />
        Move to...
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48 bg-popover border border-border shadow-lg z-50">
        {isLoading ? (
          <DropdownMenuItem disabled>Loading sections...</DropdownMenuItem>
        ) : !moduleGroups || moduleGroups.length === 0 ? (
          <DropdownMenuItem disabled>No sections available</DropdownMenuItem>
        ) : (
          moduleGroups.map((group) => {
            const isCurrentGroup = group.key === currentGroupKey;
            return (
              <DropdownMenuItem
                key={group.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCurrentGroup) {
                    handleMoveToSection(group.key, group.label);
                  }
                }}
                disabled={isCurrentGroup || isMoving}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{group.label}</span>
                {isCurrentGroup && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
