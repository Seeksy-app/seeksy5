import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { demoIntegrationsV2 } from "@/data/advertiserDemoDataV2";
import { useToast } from "@/hooks/use-toast";

const AdvertiserIntegrations = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState(demoIntegrationsV2);

  const handleConnect = (integrationId: string) => {
    toast({
      title: "Connecting...",
      description: "This would open OAuth flow in production.",
    });
  };

  const handleDisconnect = (integrationId: string) => {
    toast({
      title: "Disconnected",
      description: "Integration has been disconnected.",
    });
  };

  const handleSync = (integrationId: string) => {
    toast({
      title: "Syncing...",
      description: "Data sync started.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-white/70 mt-1">
            Connect third-party tools, tracking pixels, and analytics platforms
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 bg-white/95 backdrop-blur">
            <p className="text-2xl font-bold text-[#053877]">
              {integrations.filter((i) => i.status === "connected").length}
            </p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </Card>
          <Card className="p-5 bg-white/95 backdrop-blur">
            <p className="text-2xl font-bold text-[#053877]">
              {integrations.filter((i) => i.status === "not_connected").length}
            </p>
            <p className="text-sm text-muted-foreground">Available</p>
          </Card>
          <Card className="p-5 bg-white/95 backdrop-blur">
            <p className="text-2xl font-bold text-[#053877]">{integrations.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </Card>
        </div>

        {/* Connected Integrations */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h3 className="text-lg font-semibold text-[#053877] mb-4">Connected</h3>
          <div className="space-y-3">
            {integrations
              .filter((i) => i.status === "connected")
              .map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last synced: {integration.lastSync}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Sync
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Available Integrations */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h3 className="text-lg font-semibold text-[#053877] mb-4">Available to Connect</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {integrations
              .filter((i) => i.status === "not_connected")
              .map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                      {integration.icon}
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Button
                    className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
                    onClick={() => handleConnect(integration.id)}
                  >
                    <Plug className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              ))}
          </div>
        </Card>

        {/* Coming Soon */}
        <Card className="p-6 bg-white/95 backdrop-blur border-dashed">
          <h3 className="text-lg font-semibold text-[#053877] mb-4">Coming Soon</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "LinkedIn Ads", icon: "💼" },
              { name: "Pinterest Ads", icon: "📌" },
              { name: "Snapchat Ads", icon: "👻" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-xl">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdvertiserIntegrations;
