import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FolderSidebar } from "@/components/media/FolderSidebar";
import { MediaVaultCard, MediaType } from "@/components/media/MediaVaultCard";
import { UploadMediaDialog } from "@/components/media/UploadMediaDialog";
import { Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { ClipsGallery } from "@/components/media/ClipsGallery";

type ViewMode = "all" | "videos" | "clips" | "audio" | "images";

interface MediaFolder {
  id: string;
  name: string;
  color?: string;
  itemCount?: number;
}

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size: number;
  created_at: string;
  folder_id?: string;
  cert_status?: string;
  cert_tx_hash?: string;
  cert_explorer_url?: string;
  cert_chain?: string;
}

export default function MediaVault() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "media_file" | "clip";
    title: string;
  } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["media-folders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("media_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data as MediaFolder[];
    },
  });

  // Fetch media files
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["media-files"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch clips
  const { data: clips = [] } = useQuery({
    queryKey: ["vault-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("clips")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Transform data into unified MediaItem format
  const unifiedMedia: MediaItem[] = [
    ...mediaFiles.map((file) => ({
      id: file.id,
      type: (file.file_type?.includes("video")
        ? "video"
        : file.file_type?.includes("audio")
        ? "audio"
        : file.file_type?.includes("image")
        ? "image"
        : "video") as MediaType,
      title: file.file_name,
      url: file.file_url,
      thumbnailUrl: undefined,
      duration: file.duration_seconds || undefined,
      size: file.file_size_bytes || 0,
      created_at: file.created_at || new Date().toISOString(),
      folder_id: file.folder_id || undefined,
    })),
    ...clips.map((clip) => ({
      id: clip.id,
      type: "clip" as MediaType,
      title: clip.title || "Untitled Clip",
      url: clip.vertical_url || clip.thumbnail_url || clip.storage_path || "",
      thumbnailUrl: clip.thumbnail_url || undefined,
      duration: clip.duration_seconds || undefined,
      size: 0, // Clips don't have direct size tracking
      created_at: clip.created_at,
      folder_id: clip.collection_id || undefined,
      cert_status: clip.cert_status || undefined,
      cert_tx_hash: clip.cert_tx_hash || undefined,
      cert_explorer_url: clip.cert_explorer_url || undefined,
      cert_chain: clip.cert_chain || undefined,
    })),
  ];

  // Filter media by type
  const filterByType = (items: MediaItem[]) => {
    if (viewMode === "all") return items;
    return items.filter((item) => item.type === viewMode);
  };

  // Filter by folder
  const filterByFolder = (items: MediaItem[]) => {
    if (selectedFolderId === null) return items;
    if (selectedFolderId === "unsorted") {
      return items.filter((item) => !item.folder_id);
    }
    return items.filter((item) => item.folder_id === selectedFolderId);
  };

  // Filter by search
  const filterBySearch = (items: MediaItem[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  };

  // Apply all filters
  const filteredMedia = filterBySearch(
    filterByFolder(filterByType(unifiedMedia))
  );

  // Calculate folder item counts
  const foldersWithCounts: MediaFolder[] = folders.map((folder) => ({
    ...folder,
    itemCount: unifiedMedia.filter((item) => item.folder_id === folder.id).length,
  }));

  const unsortedCount = unifiedMedia.filter((item) => !item.folder_id).length;

  // Mutations
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("media_folders").insert({
        user_id: user.id,
        name,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-folders"] });
      toast.success("Folder created");
    },
    onError: (error) => {
      toast.error("Failed to create folder: " + error.message);
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, newName }: { folderId: string; newName: string }) => {
      const { error } = await supabase
        .from("media_folders")
        .update({ name: newName })
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-folders"] });
      toast.success("Folder renamed");
    },
    onError: (error) => {
      toast.error("Failed to rename folder: " + error.message);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      // Move all items in this folder to unsorted
      await supabase
        .from("media_files")
        .update({ folder_id: null })
        .eq("folder_id", folderId);

      const { error } = await supabase
        .from("media_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-folders"] });
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      toast.success("Folder deleted, items moved to unsorted");
    },
    onError: (error) => {
      toast.error("Failed to delete folder: " + error.message);
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string;
      type: "media_file" | "clip";
    }) => {
      const table = type === "media_file" ? "media_files" : "clips";
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      queryClient.invalidateQueries({ queryKey: ["vault-clips"] });
      toast.success("Media deleted");
      setItemToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const renameMediaMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      newName,
    }: {
      id: string;
      type: "media_file" | "clip";
      newName: string;
    }) => {
      if (type === "media_file") {
        const { error } = await supabase
          .from("media_files")
          .update({ file_name: newName })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clips")
          .update({ title: newName })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      queryClient.invalidateQueries({ queryKey: ["vault-clips"] });
      toast.success("Renamed successfully");
    },
    onError: (error) => {
      toast.error("Failed to rename: " + error.message);
    },
  });

  const moveMediaMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      folderId,
    }: {
      id: string;
      type: "media_file" | "clip";
      folderId: string | null;
    }) => {
      if (type === "media_file") {
        const { error } = await supabase
          .from("media_files")
          .update({ folder_id: folderId })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clips")
          .update({ collection_id: folderId })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      queryClient.invalidateQueries({ queryKey: ["vault-clips"] });
      toast.success("Moved to folder");
    },
    onError: (error) => {
      toast.error("Failed to move: " + error.message);
    },
  });

  const handleDeleteItem = (item: MediaItem) => {
    const isClip = item.type === "clip";
    setItemToDelete({
      id: item.id,
      type: isClip ? "clip" : "media_file",
      title: item.title,
    });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMediaMutation.mutate({
        id: itemToDelete.id,
        type: itemToDelete.type,
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Folder Sidebar */}
      <FolderSidebar
        folders={foldersWithCounts}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={(name) => createFolderMutation.mutate(name)}
        onRenameFolder={(folderId, newName) =>
          renameFolderMutation.mutate({ folderId, newName })
        }
        onDeleteFolder={(folderId) => deleteFolderMutation.mutate(folderId)}
        totalItems={unifiedMedia.length}
        unsortedItems={unsortedCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Filters and Search */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Media Library</h1>
              <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* Type Filters */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({unifiedMedia.length})
                </TabsTrigger>
                <TabsTrigger value="videos">
                  Videos (
                  {unifiedMedia.filter((m) => m.type === "video").length})
                </TabsTrigger>
                <TabsTrigger value="clips">
                  Clips ({unifiedMedia.filter((m) => m.type === "clip").length})
                </TabsTrigger>
                <TabsTrigger value="audio">
                  Audio ({unifiedMedia.filter((m) => m.type === "audio").length})
                </TabsTrigger>
                <TabsTrigger value="images">
                  Images (
                  {unifiedMedia.filter((m) => m.type === "image").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === "clips" ? (
            <ClipsGallery />
          ) : (
            <>
              {filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-muted-foreground">
                    No media found
                    {searchQuery && " matching your search"}
                    {selectedFolderId && " in this folder"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => (
                    <MediaVaultCard
                      key={item.id}
                      item={item}
                      onDelete={() => handleDeleteItem(item)}
                      onRename={(newName) => {
                        const isClip = item.type === "clip";
                        renameMediaMutation.mutate({
                          id: item.id,
                          type: isClip ? "clip" : "media_file",
                          newName,
                        });
                      }}
                      onMove={(folderId) => {
                        const isClip = item.type === "clip";
                        moveMediaMutation.mutate({
                          id: item.id,
                          type: isClip ? "clip" : "media_file",
                          folderId,
                        });
                      }}
                      folders={folders}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <UploadMediaDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["media-files"] });
        }}
        folderId={selectedFolderId === "unsorted" ? null : selectedFolderId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{itemToDelete?.title}</strong> from your media
              library.
              {itemToDelete?.type === "clip" &&
                " Blockchain certificates are not removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
