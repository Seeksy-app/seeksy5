/**
 * LinkedGbpPanel - Panel showing linked GBP location on SEO edit page
 * 
 * Shows location title, city/state, sync status, and quick jump to GBP
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type SyncStatus = 'linked' | 'warning' | 'out_of_sync';

interface LinkedGbpPanelProps {
  seoPageId: string;
}

export function LinkedGbpPanel({ seoPageId }: LinkedGbpPanelProps) {
  const navigate = useNavigate();

  const { data: links, isLoading } = useQuery({
    queryKey: ['seo-gbp-links', seoPageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_seo_links')
        .select(`
          id,
          gbp_location_id,
          sync_status,
          last_checked_at,
          gbp_locations:gbp_location_id (
            id,
            title,
            address_json
          )
        `)
        .eq('seo_page_id', seoPageId);
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!links?.length) {
    return null; // No linked GBP locations
  }

  const getSyncStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'linked':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            In Sync
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Drift
          </Badge>
        );
      case 'out_of_sync':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Out of Sync
          </Badge>
        );
    }
  };

  const formatLocation = (addressJson: any) => {
    if (!addressJson) return null;
    const parts = [
      addressJson.locality,
      addressJson.administrativeArea,
    ].filter(Boolean);
    return parts.join(', ') || null;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-3">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-primary">
          <MapPin className="h-4 w-4" />
          Linked Google Business Profile{links.length > 1 ? 's' : ''}
        </div>
        <div className="space-y-2">
          {links.map((link) => {
            const location = link.gbp_locations as any;
            if (!location) return null;
            
            const cityState = formatLocation(location.address_json);
            
            return (
              <div 
                key={link.id}
                className="flex items-center justify-between gap-2 p-2 bg-background rounded-md border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {location.title}
                    </span>
                    {getSyncStatusBadge(link.sync_status as SyncStatus)}
                  </div>
                  {cityState && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cityState}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(`/admin/gbp/location/${location.id}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View GBP
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
