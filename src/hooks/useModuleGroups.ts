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
      const { data: groups, error: groupsError } = await supabase
        .from("module_groups")
        .select("*")
        .order("sort_order");

      if (groupsError) throw groupsError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from("module_group_modules")
        .select("*")
        .order("sort_order");

      if (assignmentsError) throw assignmentsError;

      // Combine groups with their modules
      const groupsWithModules: GroupWithModules[] = (groups || []).map((group) => ({
        ...group,
        primaryModules: (assignments || [])
          .filter((a) => a.group_id === group.id && a.relationship_type === "primary")
          .sort((a, b) => a.sort_order - b.sort_order),
        associatedModules: (assignments || [])
          .filter((a) => a.group_id === group.id && a.relationship_type === "associated")
          .sort((a, b) => a.sort_order - b.sort_order),
      }));

      return groupsWithModules;
    },
  });
}

export function useModuleGroupMutations() {
  const queryClient = useQueryClient();

  const createGroup = useMutation({
    mutationFn: async (group: Omit<ModuleGroup, "id">) => {
      const { data, error } = await supabase
        .from("module_groups")
        .insert(group)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ModuleGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from("module_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const reorderGroups = useMutation({
    mutationFn: async (groups: { id: string; sort_order: number }[]) => {
      for (const group of groups) {
        const { error } = await supabase
          .from("module_groups")
          .update({ sort_order: group.sort_order })
          .eq("id", group.id);
        if (error) throw error;
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
      const { data, error } = await supabase
        .from("module_group_modules")
        .upsert({
          group_id: groupId,
          module_key: moduleKey,
          relationship_type: relationshipType,
          sort_order: sortOrder,
        }, { onConflict: 'group_id,module_key,relationship_type' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-groups"] });
    },
  });

  const removeModuleFromGroup = useMutation({
    mutationFn: async ({ groupId, moduleKey }: { groupId: string; moduleKey: string }) => {
      const { error } = await supabase
        .from("module_group_modules")
        .delete()
        .eq("group_id", groupId)
        .eq("module_key", moduleKey);
      if (error) throw error;
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

      const { data, error } = await supabase
        .from("module_group_modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
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
        await supabase.from("module_group_modules").delete().eq("group_id", groupId);
      }
      
      // Insert new assignments
      if (assignments.length > 0) {
        const { error } = await supabase.from("module_group_modules").insert(
          assignments.map(a => ({
            group_id: a.groupId,
            module_key: a.moduleKey,
            relationship_type: a.relationshipType,
            sort_order: a.sortOrder,
          }))
        );
        if (error) throw error;
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
