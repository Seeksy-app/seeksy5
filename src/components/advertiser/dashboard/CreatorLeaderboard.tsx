import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  name: string;
  avatarUrl?: string;
  ctr: number;
  engagement: number;
  costPerResult: number;
  rank: number;
  trend: "up" | "down" | "same";
}

interface CreatorLeaderboardProps {
  creators: Creator[];
}

export function CreatorLeaderboard({ creators }: CreatorLeaderboardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-amber-500 text-white";
    if (rank === 2) return "bg-slate-400 text-white";
    if (rank === 3) return "bg-amber-700 text-white";
    return "bg-slate-100 text-slate-600";
  };

  if (creators.length === 0) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-[#053877]">Creator Leaderboard</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">No performance data yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-[#053877]">Creator Leaderboard</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-left pb-3 font-medium">Rank</th>
              <th className="text-left pb-3 font-medium">Creator</th>
              <th className="text-right pb-3 font-medium">CTR</th>
              <th className="text-right pb-3 font-medium">Engagement</th>
              <th className="text-right pb-3 font-medium">Cost/Result</th>
              <th className="text-right pb-3 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {creators.map((creator) => (
              <tr key={creator.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3">
                  <Badge className={cn("w-6 h-6 flex items-center justify-center p-0 text-xs", getRankBadge(creator.rank))}>
                    {creator.rank}
                  </Badge>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={creator.avatarUrl} />
                      <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-xs">
                        {creator.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{creator.name}</span>
                  </div>
                </td>
                <td className="py-3 text-right text-sm font-medium text-[#053877]">
                  {creator.ctr.toFixed(2)}%
                </td>
                <td className="py-3 text-right text-sm">
                  {creator.engagement.toFixed(1)}%
                </td>
                <td className="py-3 text-right text-sm">
                  ${creator.costPerResult.toFixed(2)}
                </td>
                <td className="py-3 text-right">
                  {creator.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-600 ml-auto" />
                  ) : creator.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-500 ml-auto" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
