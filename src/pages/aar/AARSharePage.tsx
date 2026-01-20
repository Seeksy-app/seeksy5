import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, MapPin, Users, Trophy, BarChart3, Lightbulb, 
  CheckCircle, Download, Copy, Lock, ExternalLink, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { AAR, AARMedia, AAREventType, AARStatus, AARVisibility, Stakeholder, PullQuote, SpendItem } from '@/types/aar';
import { EVENT_TYPES } from '@/types/aar';

// Helper to safely parse AAR data from database
function parseAARFromDB(data: Record<string, unknown>): Partial<AAR> {
  const validEventTypes: AAREventType[] = ['meeting', 'community_event', 'activation', 'conference', 'sponsorship', 'webinar', 'campaign', 'other'];
  const validStatuses: AARStatus[] = ['draft', 'review', 'published'];
  const validVisibilities: AARVisibility[] = ['internal', 'client_shareable', 'public_case_study'];
  
  const eventType = validEventTypes.includes(data.event_type as AAREventType) 
    ? (data.event_type as AAREventType) 
    : 'other';
  const status = validStatuses.includes(data.status as AARStatus) 
    ? (data.status as AARStatus) 
    : 'draft';
  const visibility = validVisibilities.includes(data.visibility as AARVisibility) 
    ? (data.visibility as AARVisibility) 
    : 'internal';

  return {
    ...data,
    event_type: eventType,
    status,
    visibility,
    key_stakeholders: Array.isArray(data.key_stakeholders) ? data.key_stakeholders as Stakeholder[] : [],
    pull_quotes: Array.isArray(data.pull_quotes) ? data.pull_quotes as PullQuote[] : [],
    financial_spend: Array.isArray(data.financial_spend) ? data.financial_spend as SpendItem[] : [],
  } as Partial<AAR>;
}

export default function AARSharePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [aar, setAAR] = useState<Partial<AAR> | null>(null);
  const [media, setMedia] = useState<AARMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    checkAccessAndLoad();
  }, [id, token]);

  const checkAccessAndLoad = async () => {
    try {
      // First check if user is logged in
      const { data: userData } = await supabase.auth.getUser();
      const isLoggedIn = !!userData.user;

      // Fetch the AAR
      const { data, error } = await supabase
        .from('aars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check access
      if (data.visibility === 'internal' && !isLoggedIn) {
        // Require login for internal reports
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (data.share_password_hash && !token) {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }

      // Parse and set AAR data with proper type validation
      setAAR(parseAARFromDB(data));
      setIsAuthenticated(true);

      // Fetch media
      const { data: mediaData } = await supabase
        .from('aar_media')
        .select('*')
        .eq('aar_id', id)
        .order('display_order');

      if (mediaData) {
        setMedia(mediaData as any);
      }
    } catch (err) {
      console.error('Error loading AAR:', err);
      toast.error('AAR not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Password Required</h2>
              <p className="text-muted-foreground mt-2">This report is password protected.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); checkAccessAndLoad(); }}>
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="mb-4"
              />
              <Button type="submit" className="w-full">Access Report</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !aar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Sign In Required</h2>
            <p className="text-muted-foreground mt-2 mb-6">This is an internal report. Please sign in to view.</p>
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventTypeLabel = EVENT_TYPES.find(t => t.value === aar.event_type)?.label || aar.event_type;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Top Bar (hidden in print) */}
      <div className="print:hidden sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/aar/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-1" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 print:py-8">
        {/* Header */}
        <header className="mb-10">
          <Badge variant="outline" className="mb-3">{eventTypeLabel}</Badge>
          <h1 className="text-4xl font-bold mb-4">{aar.event_name}</h1>
          
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {aar.event_date_start && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(aar.event_date_start), 'MMMM d, yyyy')}</span>
                {aar.event_date_end && aar.event_date_end !== aar.event_date_start && (
                  <span> - {format(new Date(aar.event_date_end), 'MMMM d, yyyy')}</span>
                )}
              </div>
            )}
            {aar.location_venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{aar.location_venue}{aar.location_city_state && `, ${aar.location_city_state}`}</span>
              </div>
            )}
          </div>

          {aar.hosted_by && (
            <p className="mt-3 text-muted-foreground">Hosted by <span className="font-medium text-foreground">{aar.hosted_by}</span></p>
          )}
        </header>

        {/* Executive Summary */}
        {aar.executive_summary && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Executive Summary
            </h2>
            <Card>
              <CardContent className="pt-6 prose prose-sm max-w-none">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{aar.executive_summary}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Metrics */}
        {(aar.attendance_count || aar.leads_generated || aar.total_spend) && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Key Metrics
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              {aar.attendance_count && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{aar.attendance_count.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Attendees</p>
                  </CardContent>
                </Card>
              )}
              {aar.engagement_interactions && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{aar.engagement_interactions.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Interactions</p>
                  </CardContent>
                </Card>
              )}
              {aar.leads_generated && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{aar.leads_generated}</p>
                    <p className="text-sm text-muted-foreground">Leads</p>
                  </CardContent>
                </Card>
              )}
              {aar.total_spend && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">${aar.total_spend.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Investment</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Wins & Impact */}
        {(aar.wins_community_impact || aar.wins_relationship_building || aar.wins_business_support) && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Wins & Impact
            </h2>
            <div className="space-y-6">
              {aar.wins_community_impact && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Community Impact</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{aar.wins_community_impact}</p>
                  </CardContent>
                </Card>
              )}
              {aar.wins_relationship_building && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Relationship Building</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{aar.wins_relationship_building}</p>
                  </CardContent>
                </Card>
              )}
              {aar.wins_business_support && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Business Support</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{aar.wins_business_support}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {((aar.recommendations_repeat?.length ?? 0) > 0 || (aar.recommendations_improve?.length ?? 0) > 0) && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {(aar.recommendations_repeat?.length ?? 0) > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 text-green-600">What to Repeat</h3>
                    <ul className="space-y-2">
                      {aar.recommendations_repeat?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {(aar.recommendations_improve?.length ?? 0) > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 text-amber-600">What to Improve</h3>
                    <ul className="space-y-2">
                      {aar.recommendations_improve?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Final Assessment */}
        {aar.final_assessment && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Final Assessment</h2>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <p className="text-lg italic whitespace-pre-wrap">{aar.final_assessment}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Media Gallery */}
        {media.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Media Gallery</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {media.filter(m => m.media_type === 'image').map((item) => (
                <div key={item.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={item.storage_path} 
                    alt={item.alt_text || item.caption || 'Event photo'} 
                    className="w-full h-full object-cover"
                  />
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2">
                      {item.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t text-center text-sm text-muted-foreground">
          {aar.prepared_by && <p>Prepared by {aar.prepared_by}</p>}
          <p className="mt-1">Generated {format(new Date(), 'MMMM d, yyyy')}</p>
        </footer>
      </div>
    </div>
  );
}
