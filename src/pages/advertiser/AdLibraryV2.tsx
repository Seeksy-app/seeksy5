import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Play, Image, Mic, Download, Copy, Plus, Eye, MousePointerClick, DollarSign } from "lucide-react";
import { demoAdsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";

type AdType = "all" | "video" | "image" | "audio";

const AdLibraryV2 = () => {
  const [selectedType, setSelectedType] = useState<AdType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAd, setSelectedAd] = useState<typeof demoAdsV2[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredAds = demoAdsV2.filter((ad) => {
    const matchesType = selectedType === "all" || ad.type === selectedType;
    const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleViewAd = (ad: typeof demoAdsV2[0]) => {
    setSelectedAd(ad);
    setDrawerOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      case "audio": return <Mic className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "paused": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "draft": return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-600";
    }
  };

  const videoAds = demoAdsV2.filter(a => a.type === "video");
  const imageAds = demoAdsV2.filter(a => a.type === "image");
  const audioAds = demoAdsV2.filter(a => a.type === "audio");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Ad Library</h1>
            <p className="text-white/70 mt-1">Manage and organize your creative assets</p>
          </div>
          <Button className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Upload Ad
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 bg-white/95 backdrop-blur">
            <p className="text-sm text-muted-foreground">Total Ads</p>
            <p className="text-2xl font-bold text-[#053877]">{demoAdsV2.length}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">Video</p>
            </div>
            <p className="text-2xl font-bold text-[#053877]">{videoAds.length}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Image</p>
            </div>
            <p className="text-2xl font-bold text-[#053877]">{imageAds.length}</p>
          </Card>
          <Card className="p-4 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-muted-foreground">Audio</p>
            </div>
            <p className="text-2xl font-bold text-[#053877]">{audioAds.length}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search ads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as AdType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="video">
                  <Play className="w-4 h-4 mr-1" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Image className="w-4 h-4 mr-1" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Mic className="w-4 h-4 mr-1" />
                  Audio
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* Ad Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAds.map((ad) => (
            <Card
              key={ad.id}
              className="overflow-hidden bg-white/95 backdrop-blur hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleViewAd(ad)}
            >
              <div className="relative aspect-video bg-slate-100">
                <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-full object-cover" />
                {ad.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                )}
                {ad.type === "audio" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
                )}
                <Badge className={`absolute top-2 right-2 ${getStatusColor(ad.status)}`}>
                  {ad.status}
                </Badge>
                <Badge variant="secondary" className="absolute top-2 left-2 gap-1">
                  {getTypeIcon(ad.type)}
                  {ad.type}
                </Badge>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm truncate">{ad.title}</h4>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>CTR: {ad.metrics.ctr}%</span>
                  <span>CPM: ${ad.metrics.cpm.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAds.length === 0 && (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <p className="text-muted-foreground">No ads found matching your criteria.</p>
          </Card>
        )}
      </div>

      {/* Ad Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedAd?.title}</SheetTitle>
          </SheetHeader>
          
          {selectedAd && (
            <div className="mt-6 space-y-6">
              {/* Preview */}
              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img src={selectedAd.thumbnailUrl} alt={selectedAd.title} className="w-full h-full object-cover" />
                {selectedAd.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>

              {/* Type & Status */}
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  {getTypeIcon(selectedAd.type)}
                  {selectedAd.type}
                </Badge>
                <Badge className={getStatusColor(selectedAd.status)}>
                  {selectedAd.status}
                </Badge>
                {"duration" in selectedAd && (
                  <Badge variant="outline">{selectedAd.duration}</Badge>
                )}
                {"format" in selectedAd && (
                  <Badge variant="outline">{selectedAd.format}</Badge>
                )}
              </div>

              {/* Metrics */}
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                      <p className="font-semibold">{selectedAd.metrics.impressions.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="font-semibold">{selectedAd.metrics.clicks.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPC</p>
                      <p className="font-semibold">${selectedAd.metrics.cpc.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPM</p>
                      <p className="font-semibold">${selectedAd.metrics.cpm.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Assigned Creators */}
              {selectedAd.assignedCreators.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Assigned Creators</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAd.assignedCreators.map((creator) => (
                      <Badge key={creator} variant="outline">{creator}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Campaign
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default AdLibraryV2;
