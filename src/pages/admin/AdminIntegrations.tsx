import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Puzzle, 
  Database, 
  Cloud, 
  Mail, 
  CreditCard, 
  Video, 
  Mic, 
  Bot,
  Webhook,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
  Zap,
  Globe,
  MessageSquare,
  Calendar as CalendarIcon,
  Folder as FolderIcon,
  Box as BoxIcon,
  Search,
  Unplug,
  PlugZap,
  Loader2,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleVerifiedBadge } from "@/components/ui/google-verified-badge";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'not_connected' | 'error';
  category: string;
  configPath?: string;
  oauthEndpoint?: string;
  connectedEmail?: string;
}

const baseIntegrations: Integration[] = [
  // Core Infrastructure
  {
    id: 'supabase',
    name: 'Supabase (Lovable Cloud)',
    description: 'Database, auth, storage, and edge functions',
    icon: <Database className="w-5 h-5" />,
    status: 'connected',
    category: 'Infrastructure',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Stream',
    description: 'Video streaming and processing',
    icon: <Cloud className="w-5 h-5" />,
    status: 'connected',
    category: 'Infrastructure',
  },
  // Google Integrations
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar sync and event management',
    icon: <CalendarIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
    oauthEndpoint: 'google-calendar-auth',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Email integration and inbox sync',
    icon: <Mail className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
    oauthEndpoint: 'gmail-auth',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'File storage and document sync',
    icon: <FolderIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Google',
  },
  // Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Cloud storage and file import',
    icon: <BoxIcon className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Storage',
    oauthEndpoint: 'dropbox-auth',
  },
  // Communication
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transactional email delivery',
    icon: <Mail className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS and voice communications',
    icon: <MessageSquare className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  // AI & Media
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Voice synthesis and cloning',
    icon: <Mic className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models and Whisper transcription',
    icon: <Bot className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  {
    id: 'shotstack',
    name: 'Shotstack',
    description: 'Video rendering and clip generation',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'AI & Media',
  },
  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    icon: <CreditCard className="w-5 h-5" />,
    status: 'connected',
    category: 'Payments',
  },
  // External APIs
  {
    id: 'polygon',
    name: 'Polygon Network',
    description: 'Blockchain identity and NFT minting',
    icon: <Globe className="w-5 h-5" />,
    status: 'connected',
    category: 'Blockchain',
  },
  {
    id: 'daily',
    name: 'Daily.co',
    description: 'Video conferencing and rooms',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Meeting integration and recordings',
    icon: <Video className="w-5 h-5" />,
    status: 'connected',
    category: 'Communication',
  },
  // Webhooks & Automation
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Custom webhook endpoints',
    icon: <Webhook className="w-5 h-5" />,
    status: 'connected',
    category: 'Automation',
    configPath: '/admin/webhooks',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Workflow automation',
    icon: <Zap className="w-5 h-5" />,
    status: 'not_connected',
    category: 'Automation',
  },
];

const categoryOrder = ['Infrastructure', 'Google', 'Storage', 'AI & Media', 'Communication', 'Payments', 'Blockchain', 'Automation'];

export default function AdminIntegrations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["admin-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch connected email accounts
  const { data: emailAccounts } = useQuery({
    queryKey: ["admin-email-accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch connected social profiles (for calendar, dropbox, etc.)
  const { data: socialProfiles } = useQuery({
    queryKey: ["admin-social-profiles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("social_media_profiles")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Handle OAuth callbacks and success redirects
  useEffect(() => {
    const handleDropboxCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const success = params.get("success");
      const error = params.get("error");

      // Handle Dropbox OAuth callback (returns with ?code=...)
      if (code && !success) {
        const redirectUri = sessionStorage.getItem('dropbox_redirect') || `${window.location.origin}/admin/integrations`;
        try {
          const { data, error: exchangeError } = await supabase.functions.invoke('dropbox-auth', {
            body: { action: 'exchange_code', code, redirectUri }
          });
          
          if (exchangeError) throw exchangeError;
          
          if (data?.success) {
            toast.success("Dropbox connected successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-social-profiles"] });
          }
        } catch (err) {
          console.error("Dropbox token exchange failed:", err);
          toast.error("Failed to connect Dropbox");
        }
        sessionStorage.removeItem('dropbox_redirect');
        window.history.replaceState({}, "", "/admin/integrations");
        return;
      }

      // Handle success messages from other OAuth flows
      if (success === "gmail_connected") {
        toast.success("Gmail account connected successfully!");
        queryClient.invalidateQueries({ queryKey: ["admin-email-accounts"] });
        window.history.replaceState({}, "", "/admin/integrations");
      } else if (success === "calendar_connected") {
        toast.success("Google Calendar connected successfully!");
        queryClient.invalidateQueries({ queryKey: ["admin-social-profiles"] });
        window.history.replaceState({}, "", "/admin/integrations");
      } else if (success === "dropbox_connected") {
        toast.success("Dropbox connected successfully!");
        queryClient.invalidateQueries({ queryKey: ["admin-social-profiles"] });
        window.history.replaceState({}, "", "/admin/integrations");
      } else if (error) {
        toast.error("Connection failed. Please try again.");
        window.history.replaceState({}, "", "/admin/integrations");
      }
    };

    handleDropboxCallback();
  }, [queryClient]);

  // Compute dynamic integration statuses
  const integrations = baseIntegrations.map(integration => {
    let status = integration.status;
    let connectedEmail: string | undefined;

    if (integration.id === 'gmail') {
      const gmailAccount = emailAccounts?.find(a => a.provider === 'gmail');
      if (gmailAccount) {
        status = 'connected';
        connectedEmail = gmailAccount.email_address;
      } else {
        status = 'not_connected';
      }
    } else if (integration.id === 'google_calendar') {
      const calendarProfile = socialProfiles?.find(p => p.platform === 'google_calendar');
      if (calendarProfile) {
        status = 'connected';
        connectedEmail = calendarProfile.username;
      } else {
        status = 'not_connected';
      }
    } else if (integration.id === 'dropbox') {
      const dropboxProfile = socialProfiles?.find(p => p.platform === 'dropbox');
      if (dropboxProfile) {
        status = 'connected';
        connectedEmail = dropboxProfile.username;
      } else {
        status = 'not_connected';
      }
    }

    return { ...integration, status, connectedEmail };
  });

  const handleConnect = async (integration: Integration) => {
    if (!integration.oauthEndpoint) {
      toast.info(`${integration.name} integration coming soon`);
      return;
    }

    setConnectingId(integration.id);
    try {
      let authUrl: string | undefined;

      if (integration.id === 'dropbox') {
        // Dropbox uses different OAuth flow with action parameter
        const redirectUri = `${window.location.origin}/admin/integrations`;
        const { data, error } = await supabase.functions.invoke(integration.oauthEndpoint, {
          body: { action: 'get_auth_url', redirectUri }
        });
        if (error) throw error;
        authUrl = data?.authUrl;
        
        // Store redirect info for callback
        sessionStorage.setItem('dropbox_redirect', redirectUri);
      } else if (integration.id === 'gmail') {
        // Gmail OAuth with returnPath for proper redirect
        const { data, error } = await supabase.functions.invoke(integration.oauthEndpoint, {
          body: { returnPath: '/admin/integrations' }
        });
        if (error) throw error;
        authUrl = data?.authUrl || data?.url;
      } else {
        // Standard OAuth flow for Google Calendar, etc.
        const { data, error } = await supabase.functions.invoke(integration.oauthEndpoint);
        if (error) throw error;
        authUrl = data?.authUrl || data?.url;
      }
      
      if (!authUrl) throw new Error('No auth URL returned');

      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to connect ${integration.name}:`, error);
      toast.error(`Failed to connect ${integration.name}`);
      setConnectingId(null);
    }
  };

  const disconnectGmail = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("email_accounts")
        .delete()
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-accounts"] });
      toast.success("Gmail disconnected");
    },
    onError: () => {
      toast.error("Failed to disconnect");
    },
  });

  const handleDisconnect = async (integration: Integration) => {
    if (integration.id === 'gmail') {
      const gmailAccount = emailAccounts?.find(a => a.provider === 'gmail');
      if (gmailAccount) {
        disconnectGmail.mutate(gmailAccount.id);
      }
    } else if (integration.id === 'google_calendar' || integration.id === 'dropbox') {
      const profile = socialProfiles?.find(p => 
        (integration.id === 'google_calendar' && p.platform === 'google_calendar') ||
        (integration.id === 'dropbox' && p.platform === 'dropbox')
      );
      if (profile) {
        const { error } = await supabase
          .from("social_media_profiles")
          .delete()
          .eq("id", profile.id);
        if (error) {
          toast.error("Failed to disconnect");
        } else {
          queryClient.invalidateQueries({ queryKey: ["admin-social-profiles"] });
          toast.success(`${integration.name} disconnected`);
        }
      }
    } else {
      toast.info(`${integration.name} disconnect coming soon`);
    }
  };

  const handleRefresh = (integrationName: string) => {
    toast.success(`Refreshing ${integrationName}...`);
  };

  const filteredIntegrations = integrations.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedIntegrations = categoryOrder.reduce((acc, category) => {
    acc[category] = filteredIntegrations.filter(i => i.category === category);
    return acc;
  }, {} as Record<string, Integration[]>);

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            <XCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500">
            Not Connected
          </Badge>
        );
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status === 'not_connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Integrations</h1>
            <p className="text-muted-foreground">Manage third-party services and API connections</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/keys-vault')}>
          <Key className="w-4 h-4 mr-2" />
          Manage API Keys
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{availableCount}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{errorCount}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-foreground">{categoryOrder.length}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Groups */}
      {categoryOrder.map(category => {
        const categoryIntegrations = groupedIntegrations[category];
        if (!categoryIntegrations?.length) return null;

        return (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => (
                <Card key={integration.id} className="bg-card border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {integration.icon}
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                    {integration.connectedEmail && (
                      <p className="text-xs text-primary mb-3 truncate">{integration.connectedEmail}</p>
                    )}
                    <div className="flex gap-2">
                      {integration.configPath ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(integration.configPath!)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      ) : integration.status === 'connected' ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleRefresh(integration.name)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                          </Button>
                          {integration.oauthEndpoint && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDisconnect(integration)}
                            >
                              <Unplug className="w-3 h-3" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleConnect(integration)}
                          disabled={connectingId === integration.id}
                        >
                          {connectingId === integration.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <PlugZap className="w-3 h-3 mr-1" />
                          )}
                          {connectingId === integration.id ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        API keys and secrets are managed securely via the Keys Vault. Contact support for enterprise integrations.
      </p>
    </div>
  );
}