import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, Image, Monitor, Camera, Radio, Presentation,
  Search, Clock, ArrowLeft, Check, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: { type: string; url?: string; name?: string }) => void;
}

type MediaType = "video" | "image" | "screen" | "camera" | "rtmp" | "presentation";

const MEDIA_TYPES: { id: MediaType; name: string; icon: React.ReactNode; description: string; available: boolean }[] = [
  { id: "video", name: "Video", icon: <Video className="w-6 h-6" />, description: "From Media Library", available: true },
  { id: "image", name: "Image", icon: <Image className="w-6 h-6" />, description: "Static image overlay", available: true },
  { id: "screen", name: "Screen Share", icon: <Monitor className="w-6 h-6" />, description: "Share your screen", available: true },
  { id: "camera", name: "Extra Camera", icon: <Camera className="w-6 h-6" />, description: "Add another camera", available: true },
  { id: "presentation", name: "Presentation", icon: <Presentation className="w-6 h-6" />, description: "Slides from library", available: false },
  { id: "rtmp", name: "RTMP Source", icon: <Radio className="w-6 h-6" />, description: "External RTMP feed", available: false },
];

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  duration_seconds: number | null;
  created_at: string;
}

export function AddMediaModal({ isOpen, onClose, onSelectMedia }: AddMediaModalProps) {
  const [view, setView] = useState<"types" | "library">("types");
  const [selectedType, setSelectedType] = useState<MediaType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

  // Fetch media files from library
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["media-files-for-scene"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("media_files")
        .select("id, file_name, file_url, file_type, duration_seconds, created_at")
        .eq("user_id", user.id)
        .in("file_type", ["video", "image"])
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as MediaFile[];
    },
    enabled: view === "library",
  });

  const filteredFiles = mediaFiles.filter(f => {
    const matchesSearch = f.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "video" 
      ? f.file_type === "video" 
      : selectedType === "image" 
        ? f.file_type === "image" 
        : true;
    return matchesSearch && matchesType;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTypeSelect = (type: MediaType) => {
    if (type === "screen") {
      onSelectMedia({ type: "screen" });
      onClose();
      return;
    }
    
    if (type === "camera") {
      onSelectMedia({ type: "camera" });
      onClose();
      return;
    }
    
    if (type === "video" || type === "image") {
      setSelectedType(type);
      setView("library");
      return;
    }
    
    toast.info(`${MEDIA_TYPES.find(t => t.id === type)?.name} coming soon`);
  };

  const handleConfirmSelection = () => {
    if (selectedFile) {
      onSelectMedia({
        type: selectedFile.file_type,
        url: selectedFile.file_url,
        name: selectedFile.file_name,
      });
      onClose();
    }
  };

  const resetModal = () => {
    setView("types");
    setSelectedType(null);
    setSelectedFile(null);
    setSearchQuery("");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === "library" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("types")}
                className="h-8 w-8 mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {view === "types" ? "Add Media Source" : `Select ${selectedType === "video" ? "Video" : "Image"}`}
          </DialogTitle>
        </DialogHeader>

        {view === "types" ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {MEDIA_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                disabled={!type.available}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                  type.available
                    ? "hover:bg-muted/50 hover:border-primary/50 cursor-pointer"
                    : "opacity-50 cursor-not-allowed",
                  "border-border"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  type.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {type.icon}
                </div>
                <div>
                  <div className="font-medium">{type.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.available ? type.description : "Coming soon"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Media Grid */}
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Loading...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FolderOpen className="w-10 h-10 mb-2 opacity-50" />
                  <p>No {selectedType}s in your library</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredFiles.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        selectedFile?.id === file.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-border"
                      )}
                    >
                      {file.file_type === "video" ? (
                        <video
                          src={file.file_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Duration badge */}
                      {file.file_type === "video" && file.duration_seconds && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                          {formatDuration(file.duration_seconds)}
                        </div>
                      )}
                      
                      {/* Selected indicator */}
                      {selectedFile?.id === file.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      
                      {/* Name overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                        <p className="text-[10px] text-white truncate">{file.file_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={!selectedFile}
              >
                Add to Scene
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
