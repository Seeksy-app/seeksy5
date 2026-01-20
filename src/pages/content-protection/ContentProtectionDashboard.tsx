import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, FileCheck, Bell, HelpCircle } from "lucide-react";
import { MyProofsTab } from "@/components/content-protection/MyProofsTab";
import { MatchesAlertsTab } from "@/components/content-protection/MatchesAlertsTab";
import { CertificatesTab } from "@/components/content-protection/CertificatesTab";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ContentProtectionDashboard = () => {
  const [activeTab, setActiveTab] = useState("proofs");

  // Fetch stats with better error handling
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["content-protection-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.log("No user found for stats");
        return { protected: 0, scans: 0, matches: 0, certificates: 0 };
      }

      console.log("Fetching stats for user:", user.id);

      // Fetch protected content count
      const { count: protectedCount, error: protectedError } = await supabase
        .from("protected_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (protectedError) console.error("Protected count error:", protectedError);
      console.log("Protected count:", protectedCount);

      // Fetch active scans count
      const { count: scansCount } = await supabase
        .from("content_scan_jobs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "running");

      // Fetch matches count (pending review)
      const { count: matchesCount } = await supabase
        .from("content_matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Fetch certificates count (content with blockchain proof)
      const { count: certificatesCount } = await supabase
        .from("protected_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("blockchain_tx_hash", "is", null);

      return {
        protected: protectedCount || 0,
        scans: scansCount || 0,
        matches: matchesCount || 0,
        certificates: certificatesCount || 0,
      };
    },
    refetchOnMount: true,
    staleTime: 0,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Content Protection
                </h1>
              </div>
              <p className="text-muted-foreground">
                Protect your content, detect unauthorized use, and manage your proof certificates.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              icon={FileCheck}
              label="Protected Content"
              value={statsLoading ? "..." : String(stats?.protected || 0)}
              description="Registered items"
              tooltip="How many of your videos/podcasts are registered for protection. These have a unique fingerprint that can prove you own them."
            />
            <StatsCard
              icon={Search}
              label="Active Scans"
              value={statsLoading ? "..." : String(stats?.scans || 0)}
              description="Monitoring platforms"
              tooltip="The system is actively scanning YouTube, Spotify, and other platforms looking for unauthorized copies of your content. 0 means no scans running right now."
            />
            <StatsCard
              icon={Bell}
              label="Matches Found"
              value={statsLoading ? "..." : String(stats?.matches || 0)}
              description="Pending review"
              tooltip="Potential 'uh oh' alerts! If someone re-uploads your content elsewhere, it shows up here. 0 is good — means no one has stolen your content (yet)."
            />
            <StatsCard
              icon={Shield}
              label="Certificates"
              value={statsLoading ? "..." : String(stats?.certificates || 0)}
              description="Issued proofs"
              tooltip="Official blockchain receipts proving you own the content. Like a digital notary stamp with a date/time that can't be faked. Pending items need to be certified to get these."
            />
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="proofs" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                My Proofs
              </TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Matches & Alerts
              </TabsTrigger>
              <TabsTrigger value="certificates" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Certificates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="proofs">
              <MyProofsTab />
            </TabsContent>

            <TabsContent value="matches">
              <MatchesAlertsTab />
            </TabsContent>

            <TabsContent value="certificates">
              <CertificatesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
  tooltip: string;
}

const StatsCard = ({ icon: Icon, label, value, description, tooltip }: StatsCardProps) => (
  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export default ContentProtectionDashboard;
