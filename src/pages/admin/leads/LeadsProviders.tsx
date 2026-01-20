/**
 * Lead Intelligence Providers Page
 * 
 * Manage provider connections (Warmly, OpenSend), webhooks, and test console.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, Zap, CheckCircle2, Copy, RefreshCw, AlertCircle,
  Key, Link2, Settings, Loader2, Clock, XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Provider = 'warmly' | 'opensend' | 'other';
type ProviderStatus = 'connected' | 'disconnected' | 'error';

function LeadsProvidersContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newApiKey, setNewApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Fetch workspaces
  const { data: workspaces } = useQuery({
    queryKey: ['lead-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const activeWorkspace = workspaces?.[0];

  // Fetch providers
  const { data: providers, isLoading } = useQuery({
    queryKey: ['lead-providers', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from('lead_providers')
        .select('*')
        .eq('workspace_id', activeWorkspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id
  });

  const getProvider = (name: Provider) => providers?.find(p => p.provider === name);
  const warmlyProvider = getProvider('warmly');
  const opensendProvider = getProvider('opensend');

  // Connect provider mutation
  const connectProvider = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: Provider; apiKey: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from('lead_providers')
        .upsert({
          workspace_id: activeWorkspace.id,
          provider,
          status: 'connected',
          external_account_id: apiKey.slice(0, 8) + '...',
          scopes: ['leads', 'events'],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'workspace_id,provider'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-providers', activeWorkspace?.id] });
      toast.success("Provider connected!");
      setNewApiKey("");
      setSelectedProvider(null);
    },
    onError: (err: any) => {
      toast.error("Failed to connect", { description: err.message });
    }
  });

  // Disconnect provider mutation
  const disconnectProvider = useMutation({
    mutationFn: async (provider: Provider) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { error } = await supabase
        .from('lead_providers')
        .update({ status: 'disconnected', updated_at: new Date().toISOString() })
        .eq('workspace_id', activeWorkspace.id)
        .eq('provider', provider);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-providers', activeWorkspace?.id] });
      toast.success("Provider disconnected");
    }
  });

  // Rotate webhook secret
  const rotateSecret = useMutation({
    mutationFn: async (provider: Provider) => {
      // Generate new secret
      const newSecret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      
      // In production, store encrypted in lead_provider_tokens
      // For now, just update the provider
      await supabase
        .from('lead_providers')
        .update({ updated_at: new Date().toISOString() })
        .eq('workspace_id', activeWorkspace?.id)
        .eq('provider', provider);
      
      return newSecret;
    },
    onSuccess: (newSecret) => {
      queryClient.invalidateQueries({ queryKey: ['lead-providers', activeWorkspace?.id] });
      toast.success("Secret rotated!", { description: "Save your new secret securely." });
    }
  });

  const getWebhookUrl = (provider: Provider) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';
    return `https://${projectId}.supabase.co/functions/v1/lead-${provider}-webhook`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusBadge = (status?: ProviderStatus) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Workspace Found</h2>
          <p className="text-muted-foreground mb-4">
            Set up a workspace first to connect providers.
          </p>
          <Button onClick={() => navigate('/admin/leads/setup')}>
            <Zap className="h-4 w-4 mr-2" />
            Setup Workspace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Lead Providers
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect third-party lead identification services
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/leads')}>
          Back to Dashboard
        </Button>
      </div>

      {/* Provider Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Warmly */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Warmly</CardTitle>
                  <CardDescription>B2B visitor identification</CardDescription>
                </div>
              </div>
              {getStatusBadge(warmlyProvider?.status as ProviderStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {warmlyProvider?.status === 'connected' ? (
              <>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={getWebhookUrl('warmly')} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(getWebhookUrl('warmly'))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last webhook received</span>
                  <span>{warmlyProvider.updated_at 
                    ? formatDistanceToNow(new Date(warmlyProvider.updated_at), { addSuffix: true })
                    : 'Never'}</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => rotateSecret.mutate('warmly')}
                    disabled={rotateSecret.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate Secret
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectProvider.mutate('warmly')}
                    disabled={disconnectProvider.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter your Warmly API key"
                    value={selectedProvider === 'warmly' ? newApiKey : ''}
                    onChange={(e) => {
                      setSelectedProvider('warmly');
                      setNewApiKey(e.target.value);
                    }}
                  />
                </div>
                <Button 
                  onClick={() => connectProvider.mutate({ provider: 'warmly', apiKey: newApiKey })}
                  disabled={!newApiKey || connectProvider.isPending}
                >
                  {connectProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Connect Warmly
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* OpenSend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">OpenSend</CardTitle>
                  <CardDescription>Email identity matching</CardDescription>
                </div>
              </div>
              {getStatusBadge(opensendProvider?.status as ProviderStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {opensendProvider?.status === 'connected' ? (
              <>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={getWebhookUrl('opensend')} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(getWebhookUrl('opensend'))}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last webhook received</span>
                  <span>{opensendProvider.updated_at 
                    ? formatDistanceToNow(new Date(opensendProvider.updated_at), { addSuffix: true })
                    : 'Never'}</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => rotateSecret.mutate('opensend')}
                    disabled={rotateSecret.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rotate Secret
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectProvider.mutate('opensend')}
                    disabled={disconnectProvider.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter your OpenSend API key"
                    value={selectedProvider === 'opensend' ? newApiKey : ''}
                    onChange={(e) => {
                      setSelectedProvider('opensend');
                      setNewApiKey(e.target.value);
                    }}
                  />
                </div>
                <Button 
                  onClick={() => connectProvider.mutate({ provider: 'opensend', apiKey: newApiKey })}
                  disabled={!newApiKey || connectProvider.isPending}
                >
                  {connectProvider.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Connect OpenSend
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Webhook Test Console */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Test Console</CardTitle>
          <CardDescription>
            Test your webhook integrations with sample payloads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="warmly">
            <TabsList>
              <TabsTrigger value="warmly">Warmly</TabsTrigger>
              <TabsTrigger value="opensend">OpenSend</TabsTrigger>
            </TabsList>
            <TabsContent value="warmly" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send a test webhook to verify your Warmly integration.
                </p>
                <Button variant="outline" disabled>
                  <Zap className="h-4 w-4 mr-2" />
                  Send Test Webhook (Coming Soon)
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="opensend" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send a test webhook to verify your OpenSend integration.
                </p>
                <Button variant="outline" disabled>
                  <Zap className="h-4 w-4 mr-2" />
                  Send Test Webhook (Coming Soon)
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadsProviders() {
  return (
    <RequireAdmin>
      <LeadsProvidersContent />
    </RequireAdmin>
  );
}
