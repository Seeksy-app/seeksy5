import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { useAIJobStats } from "@/hooks/useAIJobStats";
import { Button } from "@/components/ui/button";

interface AIEditBadgeProps {
  mediaId: string;
  onRunAIEnhancement?: () => void;
}

export const AIEditBadge = ({ mediaId, onRunAIEnhancement }: AIEditBadgeProps) => {
  const { data: stats, isLoading } = useAIJobStats(mediaId);

  if (isLoading) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (!stats?.hasAIJob || stats.totalEdits === 0) {
    if (onRunAIEnhancement) {
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRunAIEnhancement}
          className="h-6 text-xs text-muted-foreground hover:text-primary"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Run AI Enhancement
        </Button>
      );
    }
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Sparkles className="h-3 w-3" />
        x0 edits
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="text-xs gap-1 bg-primary/90">
      <Sparkles className="h-3 w-3" />
      x{stats.totalEdits} edits
    </Badge>
  );
};
