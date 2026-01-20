import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Radio, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { calculateEpisodeImpressions, calculateRevenue, formatCurrency, formatNumber } from "@/lib/config/revenueModelConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PodcastStats = () => {
  const { podcastId } = useParams();
  const navigate = useNavigate();
  const [copiedRss, setCopiedRss] = useState(false);

  const { data: podcast } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["podcast-episodes-stats", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("publish_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const episodeStats = episodes?.map((episode: any) => {
    const adReads = episode.ad_reads || [];
    const episodeAge = Math.floor((Date.now() - new Date(episode.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const impressions = calculateEpisodeImpressions(episodeAge, adReads.length);
    const revenue = calculateRevenue(impressions, adReads.length);

    return {
      id: episode.id,
      title: episode.title,
      publishDate: episode.publish_date,
      adReadCount: adReads.length,
      impressions,
      revenue,
      episodeAge,
    };
  });

  const totalStats = episodeStats?.reduce(
    (acc, stat) => ({
      episodes: acc.episodes + 1,
      adReads: acc.adReads + stat.adReadCount,
      impressions: acc.impressions + stat.impressions,
      revenue: acc.revenue + stat.revenue,
    }),
    { episodes: 0, adReads: 0, impressions: 0, revenue: 0 }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyRss = async () => {
    const rssUrl = `https://seeksy.io/rss/${podcastId}`;
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopiedRss(true);
      toast.success("RSS Feed URL copied to clipboard!");
      setTimeout(() => setCopiedRss(false), 2000);
    } catch (err) {
      toast.error("Failed to copy RSS URL");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="h-64 animate-pulse bg-muted/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/podcasts")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Podcasts
        </Button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Radio className="w-8 h-8 text-primary" />
              {podcast?.title} - Analytics
            </h1>
            <p className="text-muted-foreground">
              Episode-level performance metrics and revenue estimation
            </p>
          </div>
          <Button
            onClick={handleCopyRss}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-400 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-100"
            size="lg"
          >
            {copiedRss ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                RSS Feed URL
              </>
            )}
          </Button>
        </div>

        {/* Summary Cards */}
        {totalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Episodes</div>
                <div className="text-2xl font-bold">{totalStats.episodes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Total Ad Reads</div>
                <div className="text-2xl font-bold">{totalStats.adReads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Impressions
                </div>
                <div className="text-2xl font-bold">{formatNumber(totalStats.impressions)}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="pt-6">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Est. Revenue
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalStats.revenue)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Episode Table */}
        <Card>
          <CardHeader>
            <CardTitle>Episode Performance</CardTitle>
            <CardDescription>
              Individual episode metrics and revenue breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {episodeStats && episodeStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Episode Title</TableHead>
                    <TableHead>Publish Date</TableHead>
                    <TableHead className="text-center">Ad Reads</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Est. Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {episodeStats.map((stat) => (
                    <TableRow
                      key={stat.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => navigate(`/podcasts/${podcastId}/episodes/${stat.id}`)}
                    >
                      <TableCell className="font-medium max-w-xs truncate">
                        {stat.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(stat.publishDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stat.adReadCount > 0 ? "font-medium" : "text-muted-foreground"}>
                          {stat.adReadCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(stat.impressions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(stat.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No episodes found for this podcast</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/podcasts/${podcastId}/upload`)}
                >
                  Upload Episode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        {episodeStats && episodeStats.length > 0 && (
          <Card className="mt-6 bg-muted/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                <strong>Revenue Calculation:</strong> Based on $25 CPM (cost per 1,000 impressions). 
                Impressions are currently estimated using mock data: base of 1,000 per episode, 
                with bonuses for newer episodes (&lt;30 days: +50%) and episodes with ad reads (+10% per ad). 
                Real-time impression tracking coming soon.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PodcastStats;
