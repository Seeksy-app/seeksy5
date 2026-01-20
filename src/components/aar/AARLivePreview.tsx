import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { AAR, AARMedia } from '@/types/aar';
import { EVENT_TYPES } from '@/types/aar';

interface AARLivePreviewProps {
  aar: Partial<AAR>;
  media: AARMedia[];
  clientSafe?: boolean;
}

export function AARLivePreview({ aar, media, clientSafe = false }: AARLivePreviewProps) {
  const eventTypeLabel = EVENT_TYPES.find(t => t.value === aar.event_type)?.label || aar.event_type;
  const featuredImages = media.filter(m => m.media_type === 'image').slice(0, 3);

  return (
    <div className="p-4 text-sm">
      {/* Mini Header */}
      <div className="mb-6">
        <Badge variant="outline" className="mb-2 text-xs">{eventTypeLabel}</Badge>
        <h2 className="text-lg font-bold leading-tight">{aar.event_name || 'Untitled AAR'}</h2>
        
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {aar.event_date_start && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(aar.event_date_start), 'MMM d, yyyy')}
            </span>
          )}
          {aar.location_city_state && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {aar.location_city_state}
            </span>
          )}
        </div>
      </div>

      {/* Featured Images */}
      {featuredImages.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            {featuredImages.map(img => (
              <div key={img.id} className="aspect-video rounded overflow-hidden bg-muted">
                <img src={img.storage_path} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {aar.executive_summary && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Summary</h3>
          <p className="text-muted-foreground leading-relaxed line-clamp-6">{aar.executive_summary}</p>
        </div>
      )}

      {/* Quick Metrics */}
      {(aar.attendance_count || aar.leads_generated || aar.total_spend) && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Metrics</h3>
          <div className="grid grid-cols-3 gap-2">
            {aar.attendance_count && (
              <Card className="p-2 text-center">
                <p className="text-lg font-bold">{aar.attendance_count}</p>
                <p className="text-xs text-muted-foreground">Attendees</p>
              </Card>
            )}
            {aar.leads_generated && (
              <Card className="p-2 text-center">
                <p className="text-lg font-bold">{aar.leads_generated}</p>
                <p className="text-xs text-muted-foreground">Leads</p>
              </Card>
            )}
            {aar.total_spend && !clientSafe && (
              <Card className="p-2 text-center">
                <p className="text-lg font-bold">${(aar.total_spend / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Invested</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Wins Preview */}
      {(aar.wins_community_impact || aar.wins_relationship_building) && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Wins</h3>
          <div className="space-y-3">
            {aar.wins_community_impact && (
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground line-clamp-2">{aar.wins_community_impact}</p>
              </div>
            )}
            {aar.wins_relationship_building && (
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-muted-foreground line-clamp-2">{aar.wins_relationship_building}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Preview */}
      {(aar.recommendations_repeat?.length ?? 0) > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Repeat</h3>
          <ul className="space-y-1">
            {aar.recommendations_repeat?.slice(0, 3).map((item, i) => (
              <li key={i} className="text-muted-foreground flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Final Assessment */}
      {aar.final_assessment && (
        <div className="mb-4">
          <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Assessment</h3>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <p className="italic text-muted-foreground line-clamp-4">{aar.final_assessment}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Badge */}
      <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>Status: <Badge variant="secondary" className="ml-1">{aar.status}</Badge></span>
        <span>{aar.visibility}</span>
      </div>
    </div>
  );
}
