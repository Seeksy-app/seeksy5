import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Merge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

type Segment = {
  id: string;
  name: string;
  duration: number;
};

export const MultiSegmentRecorder = () => {
  const [segments, setSegments] = useState<Segment[]>([
    { id: "1", name: "Segment 1", duration: 120 },
  ]);

  const addSegment = () => {
    const newSegment: Segment = {
      id: Date.now().toString(),
      name: `Segment ${segments.length + 1}`,
      duration: 0,
    };
    setSegments([...segments, newSegment]);
  };

  const deleteSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Multi-Segment Recording</CardTitle>
          <Badge variant="secondary">UI Only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Segments List */}
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <div className="font-medium text-sm">{segment.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(segment.duration)}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteSegment(segment.id)}
                className="h-8 w-8"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={addSegment}
            variant="outline"
            className="flex-1 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add Segment
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            size="sm"
            disabled={segments.length < 2}
          >
            <Merge className="w-4 h-4" />
            Combine All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
