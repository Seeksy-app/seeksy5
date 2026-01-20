import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AARListItem {
  id: string;
  event_name: string;
  event_type: string;
  event_date_start: string | null;
  location_city_state: string | null;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export default function AARListPage() {
  const [aars, setAars] = useState<AARListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAARs();
  }, []);

  const fetchAARs = async () => {
    try {
      const { data, error } = await supabase
        .from('aars')
        .select('id, event_name, event_type, event_date_start, location_city_state, status, visibility, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAars(data || []);
    } catch (err) {
      console.error('Error fetching AARs:', err);
      toast.error('Failed to load AARs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in first');
        return;
      }

      const shareSlug = `aar-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from('aars')
        .insert({
          event_name: 'Untitled AAR',
          event_type: 'meeting',
          owner_id: userData.user.id,
          share_slug: shareSlug,
          status: 'draft',
          visibility: 'internal',
        })
        .select()
        .single();

      if (error) throw error;
      navigate(`/aar/${data.id}`);
    } catch (err) {
      console.error('Error creating AAR:', err);
      toast.error('Failed to create AAR');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500 text-white';
      case 'review': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-1 mb-6">
        <Link to="/dashboard" className="hover:text-foreground">Resources</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">After-Action Reports</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">After-Action Reports</h1>
          <p className="text-muted-foreground mt-1">Document impact, generate insights, share results</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New AAR
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : aars.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No AARs yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first After-Action Report to document event impact, capture wins, and generate shareable content.
            </p>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First AAR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aars.map(aar => (
            <Link key={aar.id} to={`/aar/${aar.id}`}>
              <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{aar.event_name || 'Untitled'}</CardTitle>
                    <Badge className={`${getStatusColor(aar.status)} shrink-0`}>
                      {aar.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="outline" className="capitalize">
                    {getTypeLabel(aar.event_type)}
                  </Badge>
                  
                  {aar.event_date_start && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(aar.event_date_start), 'MMM d, yyyy')}
                    </div>
                  )}
                  
                  {aar.location_city_state && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {aar.location_city_state}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Clock className="h-3 w-3" />
                    Updated {format(new Date(aar.updated_at), 'MMM d, h:mm a')}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
