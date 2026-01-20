import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Eye, Video } from "lucide-react";

export function StreamingRevenueTab() {
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const user = userQuery.data;

  // Get user's profile ID
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Get My Page streaming impressions
  const streamingQuery = useQuery({
    queryKey: ["my-page-streaming", profileQuery.data?.id],
    queryFn: async () => {
      if (!profileQuery.data?.id) return [];
      
      const { data, error } = await supabase
        .from("my_page_video_impressions")
        .select("id, video_id, video_type, viewed_at")
        .eq("profile_id", profileQuery.data.id)
        .order("viewed_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching streaming impressions:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!profileQuery.data?.id,
  });

  const streamingImpressions = streamingQuery.data || [];

  // Calculate totals (assuming $5 CPM for My Page streaming)
  const totalImpressions = streamingImpressions.length;
  const streamingCPM = 5; // $5 CPM for My Page streaming
  const estimatedRevenue = (totalImpressions / 1000) * streamingCPM;
  const creatorShare = estimatedRevenue * 0.70; // 70% to creator
  const platformShare = estimatedRevenue * 0.30; // 30% to platform

  // Group by video type
  const groupedByType: Record<string, { type: string; impressions: number }> = {};
  streamingImpressions.forEach((imp: any) => {
    const type = imp.video_type || "unknown";
    if (!groupedByType[type]) {
      groupedByType[type] = {
        type: type === "ad" ? "Ad Video" : "Creator Video",
        impressions: 0,
      };
    }
    groupedByType[type].impressions++;
  });

  const typeBreakdown = Object.values(groupedByType);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${creatorShare.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Your share from streaming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total from ad plays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Video ad plays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPM Rate</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${streamingCPM.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per 1000 views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Page Streaming Revenue
          </CardTitle>
          <CardDescription>
            Earn revenue from ad videos playing on your My Page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Share (70%)</p>
              <p className="text-2xl font-bold text-green-600">${creatorShare.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Platform Share (30%)</p>
              <p className="text-2xl font-bold text-blue-600">${platformShare.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Every time a visitor views an ad video on your My Page, you earn $5 CPM (${(streamingCPM * 0.70).toFixed(2)} after revenue share).
          </p>
        </CardContent>
      </Card>

      {/* Performance by Video Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Video Type</CardTitle>
          <CardDescription>Impressions breakdown by video type on your My Page</CardDescription>
        </CardHeader>
        <CardContent>
          {typeBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video Type</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeBreakdown.map((item) => {
                  const revenue = (item.impressions / 1000) * streamingCPM * 0.70;
                  return (
                    <TableRow key={item.type}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell className="text-right">{item.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${revenue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No streaming impressions yet</p>
              <p className="text-sm">Start playing ad videos on your My Page to earn streaming revenue</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
