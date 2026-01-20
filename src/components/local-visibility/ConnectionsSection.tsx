import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Search, 
  BarChart3, 
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { Connection, ConnectionStatus } from "@/types/local-visibility";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const StatusIcon = ({ status }: { status: ConnectionStatus }) => {
  const icons = {
    connected: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    disconnected: <XCircle className="h-5 w-5 text-muted-foreground" />,
    pending: <Clock className="h-5 w-5 text-yellow-600" />,
    error: <AlertTriangle className="h-5 w-5 text-red-600" />,
  };
  return icons[status];
};

const StatusBadge = ({ status }: { status: ConnectionStatus }) => {
  const config = {
    connected: { label: 'Connected', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    disconnected: { label: 'Not Connected', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    error: { label: 'Error', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  };
  return <Badge variant="outline" className={config[status].className}>{config[status].label}</Badge>;
};

const ProviderIcon = ({ provider }: { provider: Connection['provider'] }) => {
  const icons = {
    google_business: <MapPin className="h-5 w-5" />,
    search_console: <Search className="h-5 w-5" />,
    ga4: <BarChart3 className="h-5 w-5" />,
    gtm: <Settings2 className="h-5 w-5" />,
  };
  return icons[provider];
};

const ConnectionCard = ({ 
  connection, 
  onConnect, 
  onDisconnect,
  onRefresh 
}: { 
  connection: Connection; 
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}) => {
  const providerNames = {
    google_business: 'Google Business Profile',
    search_console: 'Google Search Console',
    ga4: 'Google Analytics 4',
    gtm: 'Google Tag Manager',
  };

  const providerDescriptions = {
    google_business: 'Manage your business listing, reviews, and local visibility',
    search_console: 'View search performance and local query data',
    ga4: 'Monitor website traffic and conversions',
    gtm: 'Check tracking implementation status',
  };

  const isConnected = connection.status === 'connected';
  const isFuture = connection.provider === 'ga4' || connection.provider === 'gtm';

  return (
    <Card className={isFuture ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
            <ProviderIcon provider={connection.provider} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{providerNames[connection.provider]}</h3>
              <StatusBadge status={connection.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {providerDescriptions[connection.provider]}
            </p>

            {isConnected && (
              <div className="mt-3 space-y-1">
                {connection.accountName && (
                  <p className="text-xs text-muted-foreground">
                    Account: <span className="font-medium text-foreground">{connection.accountName}</span>
                  </p>
                )}
                {connection.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}
                  </p>
                )}
                {connection.permissions && connection.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {connection.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-[10px]">{perm}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              {isConnected ? (
                <>
                  <Button size="sm" variant="outline" onClick={onRefresh}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Sync Now
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={onDisconnect}>
                    Disconnect
                  </Button>
                </>
              ) : isFuture ? (
                <Badge variant="secondary">Coming Soon</Badge>
              ) : (
                <Button size="sm" onClick={onConnect}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ConnectionsSection() {
  const { connections, updateConnection, addActivityLog } = useLocalVisibilityStore();

  // Mock connections
  const mockConnections: Connection[] = connections.length ? connections : [
    {
      id: '1',
      provider: 'google_business',
      status: 'connected',
      accountName: 'Downtown Coffee Shop',
      accountEmail: 'owner@coffeeshop.com',
      connectedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
      permissions: ['read', 'reviews', 'hours'],
    },
    {
      id: '2',
      provider: 'search_console',
      status: 'connected',
      accountName: 'coffeeshop.com',
      connectedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
      permissions: ['read'],
    },
    {
      id: '3',
      provider: 'ga4',
      status: 'disconnected',
    },
    {
      id: '4',
      provider: 'gtm',
      status: 'disconnected',
    },
  ];

  const handleConnect = (provider: Connection['provider']) => {
    toast.info(`OAuth flow would start for ${provider}`);
    addActivityLog({
      type: 'connection_change',
      title: 'Connection initiated',
      description: `Started OAuth flow for ${provider}`,
      isAI: false,
    });
  };

  const handleDisconnect = (id: string) => {
    updateConnection(id, { status: 'disconnected', lastSyncAt: undefined });
    toast.success('Connection removed');
    addActivityLog({
      type: 'connection_change',
      title: 'Connection removed',
      description: 'Disconnected from service',
      isAI: false,
    });
  };

  const handleRefresh = (id: string) => {
    updateConnection(id, { lastSyncAt: new Date().toISOString() });
    toast.success('Syncing data...');
    addActivityLog({
      type: 'data_pull',
      title: 'Manual sync triggered',
      description: 'User requested data refresh',
      isAI: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Connected Services</CardTitle>
          <CardDescription>
            Manage your Google integrations. We request only the minimum permissions needed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Connection Cards */}
      <div className="grid gap-4">
        {mockConnections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onConnect={() => handleConnect(connection.provider)}
            onDisconnect={() => handleDisconnect(connection.id)}
            onRefresh={() => handleRefresh(connection.id)}
          />
        ))}
      </div>

      {/* Security Note */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Your data is secure</p>
              <p className="text-xs text-muted-foreground mt-1">
                We use OAuth 2.0 for secure authentication. We never store your Google password, 
                and you can revoke access at any time from your Google account settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
