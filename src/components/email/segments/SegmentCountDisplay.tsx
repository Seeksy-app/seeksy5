import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SegmentCountDisplayProps {
  segmentId: string;
}

export const SegmentCountDisplay = ({ segmentId }: SegmentCountDisplayProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: count, refetch } = useQuery({
    queryKey: ["segment-count", segmentId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("calculate-segment-count", {
        body: { segmentId },
      });

      if (error) throw error;
      return data.count || 0;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <Users className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">Segment Size</p>
        <p className="text-xs text-muted-foreground">
          This segment currently includes <Badge variant="secondary">{count?.toLocaleString() || "0"}</Badge> contacts
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
};
