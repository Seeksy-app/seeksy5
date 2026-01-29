import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// REMOVED: Auto-companion activation - now uses recommendation modal instead
// import { getAllModulesToActivate } from "@/config/moduleCompanions";

export interface ActivatedModule {
  module_id: string;
  granted_at: string;
}

export function useModuleActivation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all activated modules for current user
  const { data: activatedModules = [], isLoading, refetch } = useQuery({
    queryKey: ['user-activated-modules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from('user_modules')
        .select('*')
        .eq('user_id', user.id);

      if (result.error) {
        console.error('Error fetching activated modules:', result.error);
        return [];
      }

      // Map to our interface since types may not be regenerated yet
      return (result.data || []).map((row: any) => ({
        module_id: row.module_id || row.module_name,
        granted_at: row.granted_at || row.created_at,
      })) as ActivatedModule[];
    },
  });

  // Check if a specific module is activated
  const isModuleActivated = (moduleId: string): boolean => {
    return activatedModules.some(m => m.module_id === moduleId);
  };

  // Get list of activated module IDs
  const activatedModuleIds = activatedModules.map(m => m.module_id);

  // Activate a module - NOW ONLY ACTIVATES THE SINGLE MODULE (no auto-companions)
  const activateModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // CHANGED: Only activate THIS module, not companions
      // Companions are now handled via ModuleRecommendationModal
      const modulesToActivate = [moduleId];
      
      // Filter out already activated modules
      const newModules = modulesToActivate.filter(
        id => !activatedModules.some(m => m.module_id === id)
      );

      if (newModules.length === 0) {
        return { moduleId, companions: [] };
      }

      // Batch insert all modules
      const result = await (supabase as any)
        .from('user_modules')
        .upsert(
          newModules.map(id => ({
            user_id: user.id,
            module_name: id,
            is_enabled: true,
            created_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,module_name' }
        );

      if (result.error) throw result.error;
      
      return { 
        moduleId, 
        companions: newModules.filter(id => id !== moduleId) 
      };
    },
    onSuccess: ({ moduleId, companions }) => {
      // Immediately refetch to update state
      queryClient.invalidateQueries({ queryKey: ['user-activated-modules'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      
      const companionText = companions.length > 0 
        ? ` Also enabled: ${companions.join(', ')}.` 
        : '';
      
      toast({
        title: "Module Activated",
        description: `${moduleId} has been activated for this workspace.${companionText}`,
      });
    },
    onError: (error: any) => {
      console.error('Error activating module:', error);
      const errorMessage = error?.message || 'Failed to activate module. Please try again.';
      toast({
        title: "Activation Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Deactivate a module
  const deactivateModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await (supabase as any)
        .from('user_modules')
        .delete()
        .eq('user_id', user.id)
        .eq('module_name', moduleId);

      if (result.error) throw result.error;
      return moduleId;
    },
    onSuccess: (moduleId) => {
      queryClient.invalidateQueries({ queryKey: ['user-activated-modules'] });
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast({
        title: "Module Deactivated",
        description: `Module has been removed from your workspace.`,
      });
    },
    onError: (error) => {
      console.error('Error deactivating module:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate module. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    activatedModules,
    activatedModuleIds,
    isLoading,
    isModuleActivated,
    activateModule: activateModuleMutation.mutate,
    deactivateModule: deactivateModuleMutation.mutate,
    isActivating: activateModuleMutation.isPending,
    isDeactivating: deactivateModuleMutation.isPending,
    refetch,
  };
}
