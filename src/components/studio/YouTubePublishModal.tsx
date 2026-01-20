import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Youtube, X, Plus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface YouTubePublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
    description?: string;
    file_url?: string;
    thumbnail_url?: string;
    duration_seconds?: number;
  } | null;
}

const YOUTUBE_CATEGORIES = [
  { id: "22", name: "People & Blogs" },
  { id: "24", name: "Entertainment" },
  { id: "25", name: "News & Politics" },
  { id: "26", name: "Howto & Style" },
  { id: "27", name: "Education" },
  { id: "28", name: "Science & Technology" },
  { id: "10", name: "Music" },
  { id: "17", name: "Sports" },
  { id: "20", name: "Gaming" },
  { id: "1", name: "Film & Animation" },
  { id: "23", name: "Comedy" },
];

export function YouTubePublishModal({
  open,
  onOpenChange,
  video,
}: YouTubePublishModalProps) {
  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("27"); // Education default
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when video changes
  useState(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
    }
  });

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().replace(/^#/, "");
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 15) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePublish = async () => {
    if (!video?.file_url) {
      toast({
        title: "No Video Available",
        description: "This video doesn't have a valid file URL for upload.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your YouTube video.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: Implement YouTube upload API
    // This requires:
    // 1. Adding youtube.upload scope to youtube-auth
    // 2. Creating youtube-upload edge function
    // 3. User must have YouTube channel connected with upload permissions

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Coming Soon",
        description:
          "YouTube video upload is coming soon! We're working on adding upload capabilities to your connected YouTube account.",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Post to YouTube
          </DialogTitle>
          <DialogDescription>
            Upload your video as a full YouTube video (not a Short)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This will upload your enhanced video directly to your YouTube channel as a regular video.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="yt-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="yt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="yt-description">Description</Label>
            <Textarea
              id="yt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/5000
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (up to 15)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 15}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Category & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {YOUTUBE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isSubmitting || !title.trim()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4 mr-2" />
                Post to YouTube
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
