import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadMagnet {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  storage_path: string;
  audience_roles: string[];
  bullets: string[];
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface LeadMagnetInput {
  title: string;
  description?: string;
  slug: string;
  storage_path: string;
  audience_roles?: string[];
  bullets?: string[];
  is_active?: boolean;
}

// Fetch all lead magnets (admin view)
export function useAllLeadMagnets() {
  return useQuery({
    queryKey: ["lead-magnets", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_magnets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LeadMagnet[];
    },
  });
}

// Fetch active lead magnets (public view)
export function useActiveLeadMagnets(audienceRole?: string) {
  return useQuery({
    queryKey: ["lead-magnets", "active", audienceRole],
    queryFn: async () => {
      let query = supabase
        .from("lead_magnets")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (audienceRole) {
        query = query.contains("audience_roles", [audienceRole]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadMagnet[];
    },
  });
}

// Get a single lead magnet by slug
export function useLeadMagnetBySlug(slug: string) {
  return useQuery({
    queryKey: ["lead-magnets", "slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_magnets")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as LeadMagnet;
    },
    enabled: !!slug,
  });
}

// Create lead magnet
export function useCreateLeadMagnet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LeadMagnetInput) => {
      const { data, error } = await supabase
        .from("lead_magnets")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as LeadMagnet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-magnets"] });
      toast.success("Lead magnet created successfully");
    },
    onError: (error) => {
      console.error("Error creating lead magnet:", error);
      toast.error("Failed to create lead magnet");
    },
  });
}

// Update lead magnet
export function useUpdateLeadMagnet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: LeadMagnetInput & { id: string }) => {
      const { data, error } = await supabase
        .from("lead_magnets")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as LeadMagnet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-magnets"] });
      toast.success("Lead magnet updated successfully");
    },
    onError: (error) => {
      console.error("Error updating lead magnet:", error);
      toast.error("Failed to update lead magnet");
    },
  });
}

// Toggle lead magnet active status
export function useToggleLeadMagnetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("lead_magnets")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as LeadMagnet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lead-magnets"] });
      toast.success(data.is_active ? "Lead magnet activated" : "Lead magnet archived");
    },
    onError: (error) => {
      console.error("Error toggling lead magnet status:", error);
      toast.error("Failed to update lead magnet status");
    },
  });
}

// Delete lead magnet
export function useDeleteLeadMagnet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_magnets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-magnets"] });
      toast.success("Lead magnet deleted");
    },
    onError: (error) => {
      console.error("Error deleting lead magnet:", error);
      toast.error("Failed to delete lead magnet");
    },
  });
}

// Generate signed URL for a lead magnet
export async function getLeadMagnetSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("lead-magnets")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

  if (error) {
    console.error("Error generating signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

// Upload PDF to storage
export async function uploadLeadMagnetPdf(
  file: File,
  slug: string
): Promise<{ path: string; error: Error | null }> {
  const fileExt = file.name.split(".").pop();
  const filePath = `${slug}.${fileExt}`;

  const { error } = await supabase.storage
    .from("lead-magnets")
    .upload(filePath, file, { upsert: true });

  if (error) {
    return { path: "", error };
  }

  return { path: filePath, error: null };
}
