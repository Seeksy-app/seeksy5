import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Image as ImageIcon,
  Music,
  FileVideo,
  MoreVertical,
  Folder,
  Edit3,
  Trash2,
  Download,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MediaType = "video" | "clip" | "audio" | "image" | "document";

interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  size: number; // in bytes
  created_at: string;
  folder_id?: string;
  // Certification fields (clips only)
  cert_status?: string;
  cert_tx_hash?: string;
  cert_explorer_url?: string;
  cert_chain?: string;
}

interface MediaVaultCardProps {
  item: MediaItem;
  onDelete: () => void;
  onRename: (newName: string) => void;
  onMove: (folderId: string | null) => void;
  folders: Array<{ id: string; name: string }>;
}

export function MediaVaultCard({
  item,
  onDelete,
  onRename,
  onMove,
  folders,
}: MediaVaultCardProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(item.title);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    item.folder_id || null
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getMediaIcon = () => {
    switch (item.type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "clip":
        return <FileVideo className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getAspectRatioBadge = () => {
    // For now, return null - would need actual video metadata
    // Future: detect from video dimensions
    return null;
  };

  const getCertificationBadge = () => {
    if (item.type !== "clip" || !item.cert_status) return null;

    switch (item.cert_status) {
      case "minted":
        return (
          <Badge
            variant="default"
            className="gap-1 text-xs bg-[#053877] hover:bg-[#053877]/90"
          >
            <CheckCircle className="h-3 w-3" />
            Certified
          </Badge>
        );
      case "minting":
      case "pending":
        return (
          <Badge variant="default" className="gap-1 text-xs bg-[#5BA1FF]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Certifying
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleRename = () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    onRename(newName);
    setRenameDialogOpen(false);
  };

  const handleMove = () => {
    onMove(selectedFolderId);
    setMoveDialogOpen(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.title;
    link.click();
  };

  const handleViewCertificate = () => {
    if (item.type === "clip") {
      window.open(`/certificate/${item.id}`, "_blank");
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Thumbnail/Preview */}
        <div className="relative aspect-video bg-muted">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (item.type === "video" || item.type === "clip") && item.url ? (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              onLoadedData={(e) => {
                // Seek to 1 second for thumbnail frame
                e.currentTarget.currentTime = 1;
              }}
            />
          ) : item.type === "image" && item.url ? (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {getMediaIcon()}
            </div>
          )}

          {/* Aspect Ratio Badge - Top Left */}
          {getAspectRatioBadge() && (
            <div className="absolute top-2 left-2">{getAspectRatioBadge()}</div>
          )}

          {/* Duration - Bottom Right */}
          {item.duration && (
            <Badge className="absolute bottom-2 right-2 text-xs font-semibold bg-black/70 text-white border-0">
              {formatDuration(item.duration)}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title and Actions */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold line-clamp-2 flex-1">{item.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.open(item.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
                  <Folder className="h-4 w-4 mr-2" />
                  Move to Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                {item.type === "clip" && item.cert_status === "failed" && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        toast.loading("Retrying certification...", {
                          id: "cert-retry",
                        });
                        const { error } = await supabase.functions.invoke(
                          "mint-clip-certificate",
                          {
                            body: { clipId: item.id },
                          }
                        );
                        if (error) throw error;
                        toast.success("Certification retry initiated", {
                          id: "cert-retry",
                        });
                      } catch (error) {
                        toast.error("Failed to retry certification", {
                          id: "cert-retry",
                        });
                      }
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Retry Certification
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {item.duration ? formatDuration(item.duration) : "—"} •{" "}
              {formatSize(item.size)}
            </span>
          </div>

          {/* Certification Badge */}
          {getCertificationBadge() && (
            <div className="flex items-center gap-2">{getCertificationBadge()}</div>
          )}

          {/* Date */}
          <div className="text-xs text-muted-foreground">
            {format(new Date(item.created_at), "MMM d, yyyy")}
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Media</DialogTitle>
            <DialogDescription>Enter a new name for this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
            <DialogDescription>
              Select a folder to move this item to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant={selectedFolderId === null ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedFolderId(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              Unsorted
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
