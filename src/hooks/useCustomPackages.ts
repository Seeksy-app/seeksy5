import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomPackage {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  modules: string[];
  estimated_monthly_credits: number;
  recommended_bundle: string;
  settings: {
    theme?: string;
    layout?: string;
    showQuickStart?: boolean;
  } | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomPackages() {
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading, error } = useQuery({
    queryKey: ['custom-packages'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const result = await (supabase as any)
        .from('custom_packages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return (result.data || []) as CustomPackage[];
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // The trigger will handle unsetting other defaults
      const result = await (supabase as any)
        .from('custom_packages')
        .update({ is_default: true })
        .eq('id', packageId)
        .eq('user_id', session.user.id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-packages'] });
      toast.success("Default workspace updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update default", { description: error.message });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from('custom_packages')
        .delete()
        .eq('id', packageId)
        .eq('user_id', session.user.id);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-packages'] });
      toast.success("Workspace deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete workspace", { description: error.message });
    },
  });

  const defaultPackage = packages.find(p => p.is_default);

  return {
    packages,
    isLoading,
    error,
    defaultPackage,
    setAsDefault: setDefaultMutation.mutate,
    deletePackage: deletePackageMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
    isDeleting: deletePackageMutation.isPending,
  };
}
