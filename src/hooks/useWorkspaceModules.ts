import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCustomPackages, CustomPackage } from "./useCustomPackages";

export function useWorkspaceModules(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const { packages } = useCustomPackages();
  
  // Find the current workspace
  const currentWorkspace = workspaceId 
    ? packages.find(p => p.id === workspaceId) 
    : null;
  
  // Get modules in this workspace
  const workspaceModules = currentWorkspace?.modules || [];
  
  // Check if a module is in this workspace
  const isModuleInWorkspace = (moduleId: string): boolean => {
    return workspaceModules.includes(moduleId);
  };

  // Add module to workspace
  const addModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!workspaceId) throw new Error("No workspace selected");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get current workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('custom_packages')
        .select('modules')
        .eq('id', workspaceId)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentModules = (workspace?.modules as string[]) || [];
      
      // Don't add if already exists
      if (currentModules.includes(moduleId)) {
        return { moduleId, alreadyExists: true };
      }

      const updatedModules = [...currentModules, moduleId];

      const { error: updateError } = await supabase
        .from('custom_packages')
        .update({ 
          modules: updatedModules,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;
      
      return { moduleId, alreadyExists: false };
    },
    onSuccess: ({ moduleId, alreadyExists }) => {
      queryClient.invalidateQueries({ queryKey: ['custom-packages'] });
      
      if (!alreadyExists) {
        toast.success("Module added to workspace", {
          description: `${moduleId} is now activated in this workspace.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Error adding module:', error);
      toast.error("Failed to add module", {
        description: error?.message || "Please try again.",
      });
    },
  });

  // Remove module from workspace
  const removeModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!workspaceId) throw new Error("No workspace selected");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Get current workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('custom_packages')
        .select('modules')
        .eq('id', workspaceId)
        .eq('user_id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentModules = (workspace?.modules as string[]) || [];
      const updatedModules = currentModules.filter(m => m !== moduleId);

      const { error: updateError } = await supabase
        .from('custom_packages')
        .update({ 
          modules: updatedModules,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceId)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;
      
      return moduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-packages'] });
      toast.success("Module removed from workspace");
    },
    onError: (error: any) => {
      console.error('Error removing module:', error);
      toast.error("Failed to remove module", {
        description: error?.message || "Please try again.",
      });
    },
  });

  return {
    currentWorkspace,
    workspaceModules,
    isModuleInWorkspace,
    addModule: addModuleMutation.mutate,
    removeModule: removeModuleMutation.mutate,
    isAdding: addModuleMutation.isPending,
    isRemoving: removeModuleMutation.isPending,
  };
}
