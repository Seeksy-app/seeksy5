import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Film, Type, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoMarkerPanelProps {
  mediaFileId: string;
  videoDuration?: number;
}

interface Marker {
  id: string;
  marker_type: "b-roll" | "lower-third";
  timestamp_seconds: number;
  duration_seconds: number;
  metadata: any;
  created_at: string;
}

export const VideoMarkerPanel = ({ mediaFileId, videoDuration }: VideoMarkerPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newMarker, setNewMarker] = useState({
    type: "lower-third" as "b-roll" | "lower-third",
    timestamp: "",
    duration: "5"
  });

  // Fetch markers
  const { data: markers = [] } = useQuery({
    queryKey: ["video-markers", mediaFileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_markers")
        .select("*")
        .eq("media_file_id", mediaFileId)
        .order("timestamp_seconds", { ascending: true });
      
      if (error) throw error;
      return data as Marker[];
    }
  });

  // Add marker mutation
  const addMarkerMutation = useMutation({
    mutationFn: async (marker: typeof newMarker) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = parseFloat(marker.timestamp);
      if (isNaN(timestamp) || timestamp < 0) {
        throw new Error("Invalid timestamp");
      }

      const { error } = await supabase
        .from("video_markers")
        .insert({
          media_file_id: mediaFileId,
          marker_type: marker.type,
          timestamp_seconds: timestamp,
          duration_seconds: parseFloat(marker.duration) || 5,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-markers", mediaFileId] });
      setNewMarker({ type: "lower-third", timestamp: "", duration: "5" });
      setIsAdding(false);
      toast({
        title: "Marker added",
        description: "Video marker has been added"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Remove marker mutation
  const removeMarkerMutation = useMutation({
    mutationFn: async (markerId: string) => {
      const { error } = await supabase
        .from("video_markers")
        .delete()
        .eq("id", markerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-markers", mediaFileId] });
      toast({
        title: "Marker removed",
        description: "Video marker has been removed"
      });
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMarker = () => {
    if (!newMarker.timestamp.trim()) {
      toast({
        title: "Timestamp required",
        description: "Please enter a timestamp in seconds",
        variant: "destructive"
      });
      return;
    }
    addMarkerMutation.mutate(newMarker);
  };

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Video Markers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing markers */}
        {markers.length > 0 && (
          <div className="space-y-2">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3 flex-1">
                  {marker.marker_type === "b-roll" ? (
                    <Film className="h-4 w-4 text-primary" />
                  ) : (
                    <Type className="h-4 w-4 text-accent" />
                  )}
                  <div>
                    <Badge variant={marker.marker_type === "b-roll" ? "default" : "secondary"}>
                      {marker.marker_type === "b-roll" ? "B-Roll" : "Lower Third"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatTime(marker.timestamp_seconds)} ({marker.duration_seconds}s)
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeMarkerMutation.mutate(marker.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new marker form */}
        {isAdding ? (
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="space-y-2">
              <Label>Marker Type</Label>
              <Select
                value={newMarker.type}
                onValueChange={(value: "b-roll" | "lower-third") =>
                  setNewMarker({ ...newMarker, type: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lower-third">Lower Third</SelectItem>
                  <SelectItem value="b-roll">B-Roll</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp (seconds) *</Label>
              <Input
                id="timestamp"
                type="number"
                step="0.1"
                min="0"
                max={videoDuration || undefined}
                placeholder="30.5"
                value={newMarker.timestamp}
                onChange={(e) => setNewMarker({ ...newMarker, timestamp: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                step="0.5"
                min="1"
                placeholder="5"
                value={newMarker.duration}
                onChange={(e) => setNewMarker({ ...newMarker, duration: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddMarker}
                disabled={addMarkerMutation.isPending}
                className="flex-1"
              >
                Add Marker
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewMarker({ type: "lower-third", timestamp: "", duration: "5" });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Marker
          </Button>
        )}

        {markers.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No markers yet. Add timestamps for b-roll or lower-thirds.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
