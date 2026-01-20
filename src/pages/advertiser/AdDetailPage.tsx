import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Copy, Plus, Play, Download, BarChart3, Eye, MousePointer, DollarSign } from "lucide-react";
import { demoAdsV2, demoCreatorsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";

const AdDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the ad from demo data
  const ad = demoAdsV2.find((a) => a.id === id) || demoAdsV2[0];
  
  // Get assigned creators
  const assignedCreators = ad?.assignedCreators
    ?.map((creatorName) => demoCreatorsV2.find((c) => c.name === creatorName))
    .filter(Boolean) || demoCreatorsV2.slice(0, 2);

  if (!ad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Ad not found</p>
          <Button onClick={() => navigate("/advertiser/ad-library-v2")}>Back to Ad Library</Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Paused</Badge>;
      case "draft":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/advertiser/ad-library-v2")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{ad.title}</h1>
            <p className="text-white/70">{ad.type.charAt(0).toUpperCase() + ad.type.slice(1)} Ad</p>
          </div>
          {getStatusBadge(ad.status)}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preview Section */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden bg-white/95 backdrop-blur">
              <div className="relative aspect-video bg-slate-100">
                <img
                  src={ad.thumbnailUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                {ad.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Button size="lg" className="rounded-full w-16 h-16 bg-white/90 hover:bg-white">
                      <Play className="w-8 h-8 text-[#053877] ml-1" />
                    </Button>
                  </div>
                )}
                {ad.type === "audio" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <Play className="w-10 h-10" />
                      </div>
                      <p className="text-lg font-medium">Podcast Audio Ad</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex gap-3">
                  <Button className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Campaign
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Metrics Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Impressions</span>
                  </div>
                  <span className="font-semibold">{(ad.metrics?.impressions || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MousePointer className="w-4 h-4" />
                    <span className="text-sm">CTR</span>
                  </div>
                  <span className="font-semibold">{ad.metrics?.ctr || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">CPM</span>
                  </div>
                  <span className="font-semibold">${ad.metrics?.cpm || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">CPC</span>
                  </div>
                  <span className="font-semibold">${ad.metrics?.cpc || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white/95 backdrop-blur">
              <h3 className="font-semibold text-[#053877] mb-4">Assigned Creators</h3>
              {assignedCreators.length > 0 ? (
                <div className="space-y-3">
                  {assignedCreators.map((creator: any) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/advertiser/creators/${creator.id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={creator.avatarUrl} className="object-cover" />
                        <AvatarFallback>{creator.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{creator.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{creator.niche}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No creators assigned yet</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdDetailPage;