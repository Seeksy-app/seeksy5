import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Link2, ExternalLink, Clock, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreatorBookingLinks() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['user-profile-booking'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      return data;
    }
  });

  const { data: meetingTypes = [], isLoading } = useQuery({
    queryKey: ['creator-meeting-types-links'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: url });
  };

  const copyProfileLink = () => {
    if (profile?.username) {
      const url = `${window.location.origin}/book/${profile.username}`;
      navigator.clipboard.writeText(url);
      toast({ title: 'Profile booking link copied!', description: url });
    }
  };

  const openLink = (slug: string) => {
    window.open(`${window.location.origin}/m/${slug}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Links</h1>
          <p className="text-muted-foreground mt-1">Share your booking links to let others schedule meetings with you</p>
        </div>
        <Button onClick={() => navigate('/creator/meetings/types')}>
          Manage Meeting Types
        </Button>
      </div>

      {/* Profile Booking Link */}
      {profile?.username && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Your Personal Booking Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <code className="flex-1 p-3 bg-background rounded-lg border text-sm">
                {window.location.origin}/book/{profile.username}
              </code>
              <Button onClick={copyProfileLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={() => window.open(`/book/${profile.username}`, '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              This page shows all your active meeting types in one place
            </p>
          </CardContent>
        </Card>
      )}

      {/* Individual Meeting Type Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Individual Meeting Links</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-muted" />)}
          </div>
        ) : meetingTypes.length === 0 ? (
          <Card className="p-8 text-center">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No meeting types yet</h3>
            <p className="text-muted-foreground mb-4">Create meeting types to generate booking links</p>
            <Button onClick={() => navigate('/creator/meetings/types')}>
              Create Meeting Type
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {meetingTypes.map((type: any) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {type.duration} min
                          <span className="mx-1">•</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">/m/{type.slug}</code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => copyLink(type.slug)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openLink(type.slug)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
