import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Copy, 
  Check,
  Eye,
  Key,
  DollarSign,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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
  access_code: string | null;
  expires_at: string | null;
  require_nda_board: boolean;
  require_nda_recipient: boolean;
  projected_revenue_year1: number | null;
  projected_revenue_year2: number | null;
  projected_revenue_year3: number | null;
  target_market: string | null;
  created_at: string;
}

export default function BoardSalesOpportunities() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["board-sales-opportunities"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("sales_opportunities") as any)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sales Opportunities</h1>
        <p className="text-muted-foreground">
          View investment opportunities to share with potential investors
        </p>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities?.map((opportunity) => (
          <Card 
            key={opportunity.id} 
            className="group relative overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            {/* Status indicator */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(opportunity.status)}`} />
            
            <CardContent className="p-5 pt-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{opportunity.name}</h3>
                    {opportunity.is_featured && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {opportunity.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opportunity.tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">
                  {opportunity.status}
                </Badge>
                {opportunity.access_code && (
                  <Badge variant="outline" className="text-xs">
                    <Key className="w-3 h-3 mr-1" />
                    Protected
                  </Badge>
                )}
                {opportunity.expires_at && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(opportunity.expires_at), "MMM d")}
                  </Badge>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                {opportunity.demo_url && (
                  <a 
                    href={opportunity.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Demo
                  </a>
                )}
                {opportunity.site_url && (
                  <a 
                    href={opportunity.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Live Site
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t">
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyShareLink(opportunity.slug)}
                >
                  {copiedSlug === opportunity.slug ? (
                    <Check className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Copy Link
                </Button>
                <a 
                  href={`/invest/${opportunity.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </a>
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
          <p className="text-muted-foreground">
            Sales opportunities will appear here once created by admins.
          </p>
        </Card>
      )}
    </div>
  );
}
