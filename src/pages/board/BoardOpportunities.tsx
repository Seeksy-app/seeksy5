import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  ExternalLink, 
  Copy, 
  Check,
  Eye,
  TrendingUp,
  DollarSign,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesOpportunity {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  video_url: string | null;
  demo_url: string | null;
  site_url: string | null;
  status: string;
  is_featured: boolean;
  projected_revenue_year1: number | null;
  projected_revenue_year2: number | null;
  projected_revenue_year3: number | null;
  target_market: string | null;
  created_at: string;
}

export default function BoardOpportunities() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["board-sales-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as SalesOpportunity[];
    },
  });

  const copyShareLink = (slug: string) => {
    const shareUrl = `${window.location.origin}/invest/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedSlug(slug);
    toast.success("Share link copied to clipboard");
    setTimeout(() => setCopiedSlug(null), 2000);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Active</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Opportunities</h1>
          <p className="text-muted-foreground">
            Share investment opportunities with potential investors
          </p>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-6">
        {opportunities?.map((opportunity) => (
          <Card key={opportunity.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{opportunity.name}</CardTitle>
                    {getStatusBadge(opportunity.status)}
                    {opportunity.is_featured && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {opportunity.tagline && (
                    <CardDescription className="text-sm">
                      {opportunity.tagline}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`/invest/${opportunity.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </a>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyShareLink(opportunity.slug)}
                  >
                    {copiedSlug === opportunity.slug ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Market Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="w-4 h-4" />
                    Market
                  </div>
                  <p className="text-sm">{opportunity.target_market || "Not specified"}</p>
                </div>

                {/* Revenue Projections */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Revenue Projections
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Year 1</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(opportunity.projected_revenue_year1)}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Year 2</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(opportunity.projected_revenue_year2)}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Year 3</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(opportunity.projected_revenue_year3)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <ExternalLink className="w-4 h-4" />
                    Quick Links
                  </div>
                  <div className="space-y-1">
                    {opportunity.demo_url && (
                      <a 
                        href={opportunity.demo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                      >
                        View Demo →
                      </a>
                    )}
                    {opportunity.site_url && (
                      <a 
                        href={opportunity.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                      >
                        Live Site →
                      </a>
                    )}
                    {opportunity.video_url && (
                      <span className="text-sm text-muted-foreground">
                        ✓ Video included
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Share URL */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Share URL:</span>
                  <code className="flex-1 px-3 py-1.5 rounded bg-muted text-sm font-mono truncate">
                    {window.location.origin}/invest/{opportunity.slug}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyShareLink(opportunity.slug)}
                  >
                    {copiedSlug === opportunity.slug ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {opportunities?.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Opportunities Yet</h3>
          <p className="text-muted-foreground mb-4">
            Sales opportunities will appear here once created by admins.
          </p>
        </Card>
      )}
    </div>
  );
}
