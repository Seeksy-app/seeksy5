import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Tv, Check } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  is_verified?: boolean;
  user_id?: string;
}

interface ChannelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
  currentChannelId?: string | null;
  onSuccess?: () => void;
}

export function ChannelSelector({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  currentChannelId,
  onSuccess,
}: ChannelSelectorProps) {
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string>(currentChannelId || "");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [publishAfterAssign, setPublishAfterAssign] = useState(true);

  const { data: channels, isLoading } = useQuery({
    queryKey: ["tv-channels"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("tv_channels")
        .select("*")
        .order("name");

      if (result.error) throw result.error;
      return result.data as Channel[];
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const result = await (supabase as any)
        .from("tv_channels")
        .insert({
          name,
          slug,
          description,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (result.error) throw result.error;
      return result.data as Channel;
    },
    onSuccess: (data) => {
      toast.success("Channel created!");
      queryClient.invalidateQueries({ queryKey: ["tv-channels"] });
      setSelectedChannelId(data.id);
      setShowCreateChannel(false);
      setNewChannelName("");
      setNewChannelDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const assignToChannelMutation = useMutation({
    mutationFn: async ({ channelId, publish }: { channelId: string; publish: boolean }) => {
      const updateData: Record<string, unknown> = { channel_id: channelId };
      if (publish) {
        updateData.is_published = true;
        updateData.published_at = new Date().toISOString();
      }

      const result = await (supabase as any)
        .from("tv_content")
        .update(updateData)
        .eq("id", videoId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(publishAfterAssign ? "Video published to channel!" : "Video assigned to channel!");
      queryClient.invalidateQueries({ queryKey: ["admin-tv-content"] });
      queryClient.invalidateQueries({ queryKey: ["tv-channels"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAssign = () => {
    if (!selectedChannelId) {
      toast.error("Please select a channel");
      return;
    }
    assignToChannelMutation.mutate({ channelId: selectedChannelId, publish: publishAfterAssign });
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name is required");
      return;
    }
    createChannelMutation.mutate({
      name: newChannelName.trim(),
      description: newChannelDescription.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-primary" />
            Publish to Channel
          </DialogTitle>
          <DialogDescription>
            Assign "{videoTitle}" to a Seeksy TV channel
          </DialogDescription>
        </DialogHeader>

        {showCreateChannel ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g. American Warriors"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-desc">Description</Label>
              <Textarea
                id="channel-desc"
                placeholder="What's this channel about?"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateChannel(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={createChannelMutation.isPending}
                className="flex-1"
              >
                Create Channel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Channel</Label>
              <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a channel..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading channels...
                    </SelectItem>
                  ) : channels && channels.length > 0 ? (
                    channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                          <span>{channel.name}</span>
                          {channel.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No channels found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateChannel(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Channel
            </Button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish-after"
                checked={publishAfterAssign}
                onChange={(e) => setPublishAfterAssign(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="publish-after" className="text-sm cursor-pointer">
                Publish video immediately after assigning
              </Label>
            </div>
          </div>
        )}

        {!showCreateChannel && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedChannelId || assignToChannelMutation.isPending}
            >
              {publishAfterAssign ? "Publish to Channel" : "Assign to Channel"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
