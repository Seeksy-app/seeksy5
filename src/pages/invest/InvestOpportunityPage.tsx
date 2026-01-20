import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ExternalLink, 
  Play, 
  Target, 
  DollarSign, 
  TrendingUp,
  Users,
  Award,
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvestOpportunityPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: opportunity, isLoading, error } = useQuery({
    queryKey: ["sales-opportunity", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This investment opportunity is not available or has been archived.
            </p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "TBD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-semibold">Seeksy Investor Portal</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            Active Opportunity
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            Investment Opportunity
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {opportunity.name}
          </h1>
          {opportunity.tagline && (
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {opportunity.tagline}
            </p>
          )}
        </div>

        {/* Video Section */}
        {opportunity.video_url && (
          <Card className="mb-8 overflow-hidden bg-black/40 border-white/10">
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-800 flex items-center justify-center">
                {opportunity.video_url.includes("youtube") || opportunity.video_url.includes("vimeo") ? (
                  <iframe
                    src={opportunity.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={opportunity.video_url}
                    controls
                    className="w-full h-full"
                    poster={opportunity.thumbnail_url || undefined}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {opportunity.demo_url && (
            <a href={opportunity.demo_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
                <Play className="w-4 h-4 mr-2" />
                View Demo
              </Button>
            </a>
          )}
          {opportunity.site_url && (
            <a href={opportunity.site_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Live Site
              </Button>
            </a>
          )}
        </div>

        {/* Description */}
        {opportunity.description && (
          <Card className="mb-8 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-400" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 text-lg leading-relaxed">
                {opportunity.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pro Forma Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Market Info */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Market Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {opportunity.target_market && (
                <div>
                  <p className="text-white/50 text-sm mb-1">Target Market</p>
                  <p className="text-white font-medium">{opportunity.target_market}</p>
                </div>
              )}
              {opportunity.market_size && (
                <div>
                  <p className="text-white/50 text-sm mb-1">Market Size</p>
                  <p className="text-white font-medium">{opportunity.market_size}</p>
                </div>
              )}
              {opportunity.revenue_model && (
                <div>
                  <p className="text-white/50 text-sm mb-1">Revenue Model</p>
                  <p className="text-white font-medium">{opportunity.revenue_model}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitive Advantage */}
          {opportunity.competitive_advantage && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Competitive Advantage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">{opportunity.competitive_advantage}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue Projections */}
        {(opportunity.projected_revenue_year1 || opportunity.projected_revenue_year2 || opportunity.projected_revenue_year3) && (
          <Card className="mb-8 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-400" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-white/5">
                  <p className="text-white/50 text-sm mb-2">Year 1</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-400">
                    {formatCurrency(opportunity.projected_revenue_year1)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/5">
                  <p className="text-white/50 text-sm mb-2">Year 2</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-400">
                    {formatCurrency(opportunity.projected_revenue_year2)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/5">
                  <p className="text-white/50 text-sm mb-2">Year 3</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-400">
                    {formatCurrency(opportunity.projected_revenue_year3)}
                  </p>
                </div>
              </div>

              {/* Growth Indicator */}
              {opportunity.projected_revenue_year1 && opportunity.projected_revenue_year3 && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">
                      {Math.round((opportunity.projected_revenue_year3 / opportunity.projected_revenue_year1 - 1) * 100)}% 
                      projected 3-year growth
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer CTA */}
        <div className="text-center py-12 border-t border-white/10">
          <p className="text-white/50 text-sm mb-4">
            Interested in learning more about this opportunity?
          </p>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
            Request More Information
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Seeksy. Confidential - For Investor Review Only.
        </div>
      </footer>
    </div>
  );
}
