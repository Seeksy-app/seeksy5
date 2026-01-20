import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface VoiceDetectionsFiltersProps {
  platformFilter: string[];
  statusFilter: string[];
  dateRangeFilter: string;
  onPlatformChange: (platforms: string[]) => void;
  onStatusChange: (statuses: string[]) => void;
  onDateRangeChange: (range: string) => void;
  onClearFilters: () => void;
}

export function VoiceDetectionsFilters({
  platformFilter,
  statusFilter,
  dateRangeFilter,
  onPlatformChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
}: VoiceDetectionsFiltersProps) {
  const platforms = [
    { value: "youtube", label: "YouTube", emoji: "🎥" },
    { value: "spotify", label: "Spotify", emoji: "🎵" },
    { value: "apple_podcasts", label: "Apple Podcasts", emoji: "🎧" },
    { value: "tiktok", label: "TikTok", emoji: "📱" },
    { value: "instagram", label: "Instagram", emoji: "📸" },
    { value: "twitter", label: "Twitter", emoji: "🐦" },
    { value: "seeksy_studio", label: "Seeksy Studio", emoji: "🎙️" },
  ];

  const statuses = [
    { value: "unreviewed", label: "Unreviewed" },
    { value: "reviewed", label: "Reviewed" },
    { value: "licensed", label: "Licensed" },
    { value: "flagged", label: "Flagged" },
    { value: "ignored", label: "Ignored" },
  ];

  const dateRanges = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
    { value: "all", label: "All time" },
  ];

  const hasActiveFilters = platformFilter.length > 0 || statusFilter.length > 0 || dateRangeFilter !== "all";

  const togglePlatform = (platform: string) => {
    if (platformFilter.includes(platform)) {
      onPlatformChange(platformFilter.filter((p) => p !== platform));
    } else {
      onPlatformChange([...platformFilter, platform]);
    }
  };

  const toggleStatus = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusChange([...statusFilter, status]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Date Range */}
        <Select value={dateRangeFilter} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {dateRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Platform Filters */}
      <div>
        <p className="text-sm font-medium mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <Badge
              key={platform.value}
              variant={platformFilter.includes(platform.value) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => togglePlatform(platform.value)}
            >
              <span className="mr-1">{platform.emoji}</span>
              {platform.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <p className="text-sm font-medium mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Badge
              key={status.value}
              variant={statusFilter.includes(status.value) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => toggleStatus(status.value)}
            >
              {status.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
