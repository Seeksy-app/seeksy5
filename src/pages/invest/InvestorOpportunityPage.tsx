import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Lock, 
  Play, 
  TrendingUp, 
  Target, 
  ExternalLink,
  CheckCircle,
  Building2
} from "lucide-react";
import { toast } from "sonner";

interface SalesOpportunity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  video_url: string | null;
  demo_url: string | null;
  site_url: string | null;
  thumbnail_url: string | null;
  target_market: string | null;
  market_size: string | null;
  revenue_model: string | null;
  projected_revenue_year1: number | null;
  projected_revenue_year2: number | null;
  projected_revenue_year3: number | null;
  key_metrics: Record<string, unknown> | null;
  competitive_advantage: string | null;
  access_code: string | null;
}

interface OpportunityVideo {
  id: string;
  display_order: number;
  demo_videos: {
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    thumbnail_url: string | null;
    duration_seconds: number | null;
  };
}

export default function InvestorOpportunityPage() {
  const { slug } = useParams();
  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Check sessionStorage for previously unlocked
  useEffect(() => {
    const unlockedOpportunities = JSON.parse(sessionStorage.getItem("unlockedOpportunities") || "{}");
    if (unlockedOpportunities[slug || ""]) {
      setIsUnlocked(true);
    }
  }, [slug]);

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["invest-opportunity", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      
      if (error) throw error;
      return data as SalesOpportunity;
    },
    enabled: !!slug,
  });

  const { data: videos } = useQuery({
    queryKey: ["opportunity-videos", opportunity?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_opportunity_videos")
        .select(`
          id,
          display_order,
          demo_videos (
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            duration_seconds
          )
        `)
        .eq("opportunity_id", opportunity!.id)
        .order("display_order");
      
      if (error) throw error;
      return data as OpportunityVideo[];
    },
    enabled: !!opportunity?.id && isUnlocked,
  });

  const verifyAccessCode = async () => {
    if (!opportunity) return;
    
    setIsVerifying(true);
    
    // Check if access code matches
    if (accessCode.toUpperCase() === (opportunity.access_code || "").toUpperCase()) {
      setIsUnlocked(true);
      
      // Store in sessionStorage
      const unlockedOpportunities = JSON.parse(sessionStorage.getItem("unlockedOpportunities") || "{}");
      unlockedOpportunities[slug || ""] = true;
      sessionStorage.setItem("unlockedOpportunities", JSON.stringify(unlockedOpportunities));
      
      // Log access
      await supabase.from("sales_opportunity_access").insert({
        opportunity_id: opportunity.id,
        access_code_used: accessCode,
      });
      
      toast.success("Access granted!");
    } else {
      toast.error("Invalid access code");
    }
    
    setIsVerifying(false);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <Skeleton className="h-12 w-48 mx-auto mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
            <p className="text-muted-foreground">
              This investment opportunity does not exist or is no longer active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access code gate
  if (!isUnlocked && opportunity.access_code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-white">{opportunity.name}</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the access code provided by your contact to view this opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-slate-300">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-lg tracking-widest"
                maxLength={12}
                onKeyDown={(e) => e.key === "Enter" && verifyAccessCode()}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={verifyAccessCode}
              disabled={!accessCode || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Access Opportunity"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unlocked view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{opportunity.name}</h1>
              <p className="text-sm text-slate-400">{opportunity.tagline}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified Access
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Video Section */}
        {videos && videos.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Featured Videos</h2>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Video Player */}
              <div className="lg:col-span-2">
                <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
                  <iframe
                    src={videos[activeVideoIndex]?.demo_videos?.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-white">
                    {videos[activeVideoIndex]?.demo_videos?.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {videos[activeVideoIndex]?.demo_videos?.description}
                  </p>
                </div>
              </div>

              {/* Video Playlist */}
              <div className="space-y-3">
                <p className="text-sm text-slate-400">{videos.length} videos</p>
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideoIndex(index)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      index === activeVideoIndex
                        ? "bg-primary/20 border border-primary/50"
                        : "bg-slate-800/50 hover:bg-slate-700/50 border border-transparent"
                    }`}
                  >
                    <div className="relative w-24 h-14 rounded bg-slate-700 flex-shrink-0 overflow-hidden">
                      {video.demo_videos?.thumbnail_url ? (
                        <img 
                          src={video.demo_videos.thumbnail_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      {index === activeVideoIndex && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {video.demo_videos?.title}
                      </p>
                      {video.demo_videos?.duration_seconds && (
                        <p className="text-xs text-slate-500">
                          {Math.floor(video.demo_videos.duration_seconds / 60)}:{String(video.demo_videos.duration_seconds % 60).padStart(2, "0")}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Overview Section */}
        <section className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Market Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {opportunity.target_market && (
                <div>
                  <p className="text-sm text-slate-400">Target Market</p>
                  <p className="text-white">{opportunity.target_market}</p>
                </div>
              )}
              {opportunity.market_size && (
                <div>
                  <p className="text-sm text-slate-400">Market Size</p>
                  <p className="text-white">{opportunity.market_size}</p>
                </div>
              )}
              {opportunity.competitive_advantage && (
                <div>
                  <p className="text-sm text-slate-400">Competitive Advantage</p>
                  <p className="text-white">{opportunity.competitive_advantage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Year 1</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(opportunity.projected_revenue_year1)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Year 2</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(opportunity.projected_revenue_year2)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Year 3</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(opportunity.projected_revenue_year3)}
                  </p>
                </div>
              </div>
              {opportunity.revenue_model && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">Revenue Model</p>
                  <p className="text-white">{opportunity.revenue_model}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Description */}
        {opportunity.description && (
          <section>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">About This Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{opportunity.description}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Quick Links */}
        <section className="flex flex-wrap gap-4">
          {opportunity.demo_url && (
            <a href={opportunity.demo_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </a>
          )}
          {opportunity.site_url && (
            <a href={opportunity.site_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Live Site
              </Button>
            </a>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>This is a confidential investment opportunity. Please do not share without permission.</p>
        </div>
      </footer>
    </div>
  );
}