import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, TrendingUp, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const ChannelsTab = () => {
  const { data: channels } = useQuery({
    queryKey: ["gtm-channels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gtm_channels")
        .select("*")
        .order("display_order");
      return data || [];
    },
  });

  const getCostEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case "Very High": return "text-green-600 dark:text-green-400";
      case "High": return "text-blue-600 dark:text-blue-400";
      case "Medium": return "text-yellow-600 dark:text-yellow-400";
      default: return "text-muted-foreground";
    }
  };

  const getCostEfficiencyDollarSigns = (efficiency: string) => {
    switch (efficiency) {
      case "Very High": return "$";
      case "High": return "$$";
      case "Medium": return "$$$";
      default: return "$$$$";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Marketing Channel Performance</h2>
      </div>

      <div className="grid gap-4">
        {channels?.map((channel) => (
          <Card key={channel.id} className="hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{channel.channel_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{channel.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {channel.conversion_rate}% Conv.
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reach Potential */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Reach Potential</span>
                    <span className="text-sm font-medium">{channel.reach_potential}% of target</span>
                  </div>
                  <Progress value={channel.reach_potential} className="h-3" />
                </div>

                {/* Cost Efficiency */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Cost Efficiency</span>
                    <span className={`text-sm font-medium ${getCostEfficiencyColor(channel.cost_efficiency)}`}>
                      <DollarSign className="w-4 h-4 inline" />
                      {getCostEfficiencyDollarSigns(channel.cost_efficiency)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level}
                        className={`h-3 flex-1 rounded ${
                          (channel.cost_efficiency === "Very High" && level === 1) ||
                          (channel.cost_efficiency === "High" && level <= 2) ||
                          (channel.cost_efficiency === "Medium" && level <= 3) ||
                          (channel.cost_efficiency === "Low" && level <= 4)
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommended Budget Allocation */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Recommended Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">35%</p>
              <p className="text-sm text-muted-foreground mt-1">Community Building</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">25%</p>
              <p className="text-sm text-muted-foreground mt-1">Content Marketing</p>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">20%</p>
              <p className="text-sm text-muted-foreground mt-1">Partnerships</p>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">20%</p>
              <p className="text-sm text-muted-foreground mt-1">Paid Acquisition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
