import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCFOProFormaStatus, type CFOSectionKey } from './useCFOProFormaStatus';

export interface CFOProFormaVersion {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
  assumptions: Record<string, any>;
  is_published: boolean;
  notes: string | null;
}

export function useCFOProFormaVersions() {
  const queryClient = useQueryClient();
  const { resetAllSections, getAllSectionData, sectionStatus } = useCFOProFormaStatus();

  // Fetch all saved versions
  const { data: versions, isLoading } = useQuery({
    queryKey: ['cfo-proforma-versions'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('cfo_proforma_versions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (result.error) throw result.error;
      return result.data as CFOProFormaVersion[];
    },
  });

  // Get latest published version (for Board view)
  const { data: latestVersion, isLoading: latestLoading } = useQuery({
    queryKey: ['cfo-proforma-versions', 'latest'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('cfo_proforma_versions')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (result.error && result.error.code !== 'PGRST116') throw result.error; // Ignore not found
      return result.data as CFOProFormaVersion | null;
    },
  });

  // Save a new version
  const saveVersion = useMutation({
    mutationFn: async ({
      name,
      notes,
      assumptions,
    }: {
      name: string;
      notes?: string;
      assumptions: Record<string, any>;
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('You must be logged in to save a version');
      }
      
      const result = await (supabase as any)
        .from('cfo_proforma_versions')
        .insert({
          name,
          notes: notes || null,
          assumptions,
          created_by: user.id,
          is_published: true,
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cfo-proforma-versions'] });
      resetAllSections();
      toast.success(`Pro Forma Version Saved and Published to Board.`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save version: ${error.message}`);
    },
  });

  // Delete a version
  const deleteVersion = useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any)
        .from('cfo_proforma_versions')
        .delete()
        .eq('id', id);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo-proforma-versions'] });
      toast.success('Version deleted');
    },
  });

  // Check if all sections are complete
  const isProFormaComplete = Object.values(sectionStatus).every(v => v === true);

  // Build full assumptions from all section data
  const buildFullAssumptions = () => {
    const sectionData = getAllSectionData();
    return {
      sections: sectionData,
      sectionStatus: { ...sectionStatus },
      savedAt: new Date().toISOString(),
    };
  };

  return {
    versions,
    latestVersion,
    isLoading,
    latestLoading,
    saveVersion: saveVersion.mutate,
    deleteVersion: deleteVersion.mutate,
    isSaving: saveVersion.isPending,
    isProFormaComplete,
    buildFullAssumptions,
  };
}
