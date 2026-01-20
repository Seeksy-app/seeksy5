import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Clock,
  Shield,
  CheckCircle,
  Globe,
  Video,
  Music,
  Mic,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateVoiceDetectionStatus } from "@/lib/api/voiceDetectionsAPI";
import type { VoiceDetection } from "@/lib/api/voiceDetectionsAPI";

interface VoiceDetectionsListProps {
  detections: VoiceDetection[];
  onUpdate: () => void;
}

export function VoiceDetectionsList({ detections, onUpdate }: VoiceDetectionsListProps) {
  const [selectedDetection, setSelectedDetection] = useState<VoiceDetection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Video className="h-5 w-5" />;
      case 'spotify':
      case 'apple_podcasts':
        return <Music className="h-5 w-5" />;
      case 'seeksy_studio':
      case 'seeksy_meetings':
        return <Mic className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getPlatformEmoji = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '🎥';
      case 'spotify':
        return '🎵';
      case 'apple_podcasts':
        return '🎧';
      case 'tiktok':
        return '📱';
      case 'instagram':
        return '📸';
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Reviewed</Badge>;
      case 'licensed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Licensed</Badge>;
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      case 'ignored':
        return <Badge variant="outline" className="opacity-50">Ignored</Badge>;
      default:
        return <Badge variant="secondary">Unreviewed</Badge>;
    }
  };

  const handleOpenDetails = (detection: VoiceDetection) => {
    setSelectedDetection(detection);
    setEditingStatus(detection.status);
    setEditingNotes(detection.notes || "");
    setDetailsOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedDetection) return;

    setSaving(true);
    try {
      await updateVoiceDetectionStatus(
        selectedDetection.id,
        editingStatus,
        editingNotes
      );
      toast.success("Detection updated successfully");
      setDetailsOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating detection:", error);
      toast.error("Failed to update detection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {detections.map((detection) => (
          <Card
            key={detection.id}
            className="p-6 border-2 hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => handleOpenDetails(detection)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                  {getPlatformEmoji(detection.platform)}
                </div>
                <div>
                  <h4 className="text-lg font-semibold line-clamp-1">
                    {detection.source_title || 'Untitled Content'}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {detection.platform.replace('_', ' ')}
                  </p>
                </div>
              </div>
              {getStatusBadge(detection.status)}
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              {detection.usage_category && (
                <div className="flex items-center gap-1">
                  <Mic className="h-4 w-4" />
                  <span className="capitalize">{detection.usage_category.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(detection.detected_at), "MMM dd, yyyy")}</span>
              </div>
              {detection.confidence && (
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>{Math.round(detection.confidence * 100)}% match</span>
                </div>
              )}
            </div>

            {detection.source_url && (
              <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                <a href={detection.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Content
                </a>
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Detection Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detection Details</DialogTitle>
          </DialogHeader>

          {selectedDetection && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="text-3xl">
                  {getPlatformEmoji(selectedDetection.platform)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedDetection.source_title || 'Untitled Content'}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedDetection.platform.replace('_', ' ')} · {selectedDetection.source_type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Detection Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                  <p className="text-2xl font-bold">
                    {selectedDetection.confidence ? `${Math.round(selectedDetection.confidence * 100)}%` : 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Detected On</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(selectedDetection.detected_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              {selectedDetection.first_spoken_at_sec && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Voice Detected At</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">First Spoken</p>
                      <p className="font-mono font-semibold">
                        {Math.floor(selectedDetection.first_spoken_at_sec / 60)}:{String(Math.floor(selectedDetection.first_spoken_at_sec % 60)).padStart(2, '0')}
                      </p>
                    </div>
                    {selectedDetection.last_spoken_at_sec && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Spoken</p>
                        <p className="font-mono font-semibold">
                          {Math.floor(selectedDetection.last_spoken_at_sec / 60)}:{String(Math.floor(selectedDetection.last_spoken_at_sec % 60)).padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editingStatus} onValueChange={setEditingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unreviewed">Unreviewed</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="licensed">Licensed</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add notes about this detection..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedDetection.source_url && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={selectedDetection.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Content
                    </a>
                  </Button>
                )}
                <Button onClick={handleSaveChanges} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
