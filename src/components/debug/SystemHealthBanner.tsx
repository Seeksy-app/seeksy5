import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HealthStatus {
  lastIdentitySync: string | null;
  lastRDFeedSync: string | null;
  ingestionStatus: 'ok' | 'warning' | 'error';
  errors: string[];
}

export const SystemHealthBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    lastIdentitySync: null,
    lastRDFeedSync: null,
    ingestionStatus: 'ok',
    errors: [],
  });

  // Fetch identity sync timestamp
  const { data: identityData } = useQuery({
    queryKey: ['health-identity-sync'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('identity_assets')
        .select('updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data?.updated_at || null;
    },
    refetchInterval: 30000,
  });

  // Fetch R&D feed sync timestamp
  const { data: rdFeedData } = useQuery({
    queryKey: ['health-rd-feed-sync'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rd_feeds' as any)
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return (data as any)?.created_at || null;
    },
    refetchInterval: 30000,
  });

  // Fetch R&D feed items count
  const { data: feedItemsCount } = useQuery({
    queryKey: ['health-rd-feed-items'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('rd_feed_items' as any)
        .select('*', { count: 'exact', head: true });
      
      return { count: count || 0, error: error?.message || null };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const errors: string[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    if (feedItemsCount?.error) {
      errors.push(`Feed items error: ${feedItemsCount.error}`);
      status = 'error';
    }

    if (feedItemsCount?.count === 0 && rdFeedData) {
      errors.push('No feed items ingested yet');
      status = 'warning';
    }

    setHealthStatus({
      lastIdentitySync: identityData || null,
      lastRDFeedSync: rdFeedData || null,
      ingestionStatus: status,
      errors,
    });
  }, [identityData, rdFeedData, feedItemsCount]);

  if (dismissed) return null;

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString();
  };

  const getStatusColor = () => {
    switch (healthStatus.ingestionStatus) {
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-md ${getStatusColor()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          {healthStatus.ingestionStatus === 'ok' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-sm">System Health</p>
            <div className="text-xs space-y-0.5">
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Identity Sync: {formatTimestamp(healthStatus.lastIdentitySync)}
              </p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                R&D Feed Sync: {formatTimestamp(healthStatus.lastRDFeedSync)}
              </p>
              <p>
                Feed Items: {feedItemsCount?.count || 0}
              </p>
              {healthStatus.errors.length > 0 && (
                <div className="mt-1 pt-1 border-t border-current/20">
                  {healthStatus.errors.map((err, i) => (
                    <p key={i} className="text-red-700">{err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1 -mr-1"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
