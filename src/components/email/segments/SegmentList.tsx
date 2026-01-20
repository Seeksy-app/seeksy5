import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Segment {
  id: string;
  name: string;
  description: string;
  created_at: string;
  segment_filters: any[];
}

interface SegmentListProps {
  segments: Segment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SegmentList({ segments, selectedId, onSelect }: SegmentListProps) {
  const [search, setSearch] = useState("");

  const filteredSegments = segments.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Your Segments</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search segments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No segments found
          </div>
        ) : (
          filteredSegments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSelect(segment.id)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all hover:bg-muted/50",
                selectedId === segment.id && "bg-primary/10 border-primary"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{segment.name}</div>
                  {segment.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {segment.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {segment.segment_filters.length} filter{segment.segment_filters.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
