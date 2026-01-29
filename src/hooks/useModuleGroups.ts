import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModuleGroup {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_system: boolean;
}

export interface ModuleGroupModule {
  id: string;
  group_id: string;
  module_key: string;
  relationship_type: "primary" | "associated";
  sort_order: number;
}

export interface GroupWithModules extends ModuleGroup {
  primaryModules: ModuleGroupModule[];
  associatedModules: ModuleGroupModule[];
}

export function useModuleGroups() {
  return useQuery({
    queryKey: ["module-groups"],
    queryFn: async () => {
      const groupsResult = await (supabase as any)
        .from("module_groups")
        .select("*")
        .order("sort_order");

      if (groupsResult.error) throw groupsResult.error;
      const groups = groupsResult.data as any[];

      const assignmentsResult = await (supabase as any)
        .from("module_group_modules")
        .select("*")
        .order("sort_order");

      if (assignmentsResult.error) throw assignmentsResult.error;
      const assignments = assignmentsResult.data as any[];

      // Combine groups with their modules
      const groupsWithModules: GroupWithModules[] = (groups || []).map((group: any) => ({
        ...group,
        primaryModules: (assignments || [])
          .filter((a: any) => a.group_id === group.id && a.relationship_type === "primary")
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
        associatedModules: (assignments || [])
          .filter((a: any) => a.group_id === group.id && a.relationship_type === "associated")
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
      }));

      return groupsWithModules;
    },
  });
}

export function useModuleGroupMutations() {
  const queryClient = useQueryClient();

  const createGroup = useMutation({
    mutationFn: async (group: Omit<ModuleGroup, "id">) => {
      const result = await (supabase as any)
        .from("module_groups")
        .insert(group)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ModuleGroup> & { id: string }) => {
      const result = await (supabase as any)
        .from("module_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any).from("module_groups").delete().eq("id", id);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const reorderGroups = useMutation({
    mutationFn: async (groups: { id: string; sort_order: number }[]) => {
      for (const group of groups) {
        const result = await (supabase as any)
          .from("module_groups")
          .update({ sort_order: group.sort_order })
          .eq("id", group.id);
        if (result.error) throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const addModuleToGroup = useMutation({
    mutationFn: async ({
      groupId,
      moduleKey,
      relationshipType,
      sortOrder,
    }: {
      groupId: string;
      moduleKey: string;
      relationshipType: "primary" | "associated";
      sortOrder: number;
    }) => {
      const result = await (supabase as any)
        .from("module_group_modules")
        .upsert({
          group_id: groupId,
          module_key: moduleKey,
          relationship_type: relationshipType,
          sort_order: sortOrder,
        }, { onConflict: 'group_id,module_key,relationship_type' })
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const removeModuleFromGroup = useMutation({
    mutationFn: async ({ groupId, moduleKey }: { groupId: string; moduleKey: string }) => {
      const result = await (supabase as any)
        .from("module_group_modules")
        .delete()
        .eq("group_id", groupId)
        .eq("module_key", moduleKey);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const updateModuleAssignment = useMutation({
    mutationFn: async ({
      id,
      sortOrder,
      relationshipType,
    }: {
      id: string;
      sortOrder?: number;
      relationshipType?: "primary" | "associated";
    }) => {
      const updates: Record<string, unknown> = {};
      if (sortOrder !== undefined) updates.sort_order = sortOrder;
      if (relationshipType !== undefined) updates.relationship_type = relationshipType;

      const result = await (supabase as any)
        .from("module_group_modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const bulkSaveAssignments = useMutation({
    mutationFn: async (assignments: {
      groupId: string;
      moduleKey: string;
      relationshipType: "primary" | "associated";
      sortOrder: number;
    }[]) => {
      // Delete all existing assignments for groups being updated
      const groupIds = [...new Set(assignments.map(a => a.groupId))];
      for (const groupId of groupIds) {
        await (supabase as any).from("module_group_modules").delete().eq("group_id", groupId);
      }
      
      // Insert new assignments
      if (assignments.length > 0) {
        const result = await (supabase as any).from("module_group_modules").insert(
          assignments.map(a => ({
            group_id: a.groupId,
            module_key: a.moduleKey,
            relationship_type: a.relationshipType,
            sort_order: a.sortOrder,
          }))
        );
        if (result.error) throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    addModuleToGroup,
    removeModuleFromGroup,
    updateModuleAssignment,
    bulkSaveAssignments,
  };
}
