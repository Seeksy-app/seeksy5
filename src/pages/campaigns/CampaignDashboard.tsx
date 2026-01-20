import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  PenTool, 
  Calendar, 
  DollarSign, 
  Globe,
  Sparkles,
  Edit,
  RefreshCw,
  Mail,
  Phone,
  Video,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CampaignAuthModal } from "@/components/campaigns/CampaignAuthModal";

// Updated brand colors - lighter Federal Benefits theme
const colors = {
  background: "#F7F9FC",
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  primary: "#003A9E",
  secondary: "#1A73E8",
  accent: "#FFD764",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
};

interface Candidate {
  id: string;
  display_name: string;
  preferred_name: string | null;
  office: string | null;
  jurisdiction: string | null;
  election_date: string | null;
  party_or_affiliation: string | null;
  campaign_status: string;
  top_issues: string[] | null;
}

const quickActions = [
  { label: "Plan my campaign", icon: Sparkles, path: "/campaigns/ai-manager" },
  { label: "Write a speech", icon: PenTool, path: "/campaigns/studio" },
  { label: "Create social posts", icon: PenTool, path: "/campaigns/studio" },
  { label: "Schedule an event", icon: Calendar, path: "/campaigns/outreach" },
  { label: "Draft fundraising email", icon: DollarSign, path: "/campaigns/studio" },
  { label: "Build campaign website", icon: Globe, path: "/campaigns/site-builder" },
  { label: "Start Email Campaign", icon: Mail, path: "/campaigns/email" },
  { label: "Start SMS Broadcast", icon: Phone, path: "/campaigns/sms" },
  { label: "Go Live on Streaming", icon: Video, path: "/campaigns/live" },
  { label: "View Donation Tools", icon: CreditCard, path: "/campaigns/donations" },
];

const suggestedTasks = [
  "Draft your 2-minute stump speech opening",
  "Schedule your first town hall event",
  "Write a donor outreach email",
  "Create 3 social media posts about your top issue",
  "Set up your campaign website"
];

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) {
        setAuthModalOpen(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setAuthModalOpen(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadCandidate();
      setAuthModalOpen(false);
    }
  }, [user]);

  const loadCandidate = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("campaign_candidates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCandidate(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exploring": return { bg: "#DBEAFE", text: "#1D4ED8" };
      case "announced": return { bg: "#FEF3C7", text: "#B45309" };
      case "active": return { bg: "#D1FAE5", text: "#059669" };
      case "runoff": return { bg: "#E9D5FF", text: "#7C3AED" };
      default: return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  if (loading && user) {
    return (
      <CampaignLayout>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: colors.primary }} />
        </div>
      </CampaignLayout>
    );
  }

  return (
    <CampaignLayout>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textDark }}>
            {candidate?.display_name || "Welcome, Candidate"}
            {candidate?.office && (
              <span className="font-normal text-lg ml-2" style={{ color: colors.textMuted }}>
                for {candidate.office}
              </span>
            )}
          </h1>
          {candidate?.election_date && (
            <p className="mt-1" style={{ color: colors.textMuted }}>
              Election: {new Date(candidate.election_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button 
          asChild 
          style={{ backgroundColor: colors.accent, color: colors.textDark }}
          className="font-medium"
        >
          <Link to="/campaigns/ai-manager">
            <MessageSquare className="h-4 w-4 mr-2" />
            Talk to AI Campaign Manager
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Campaign Snapshot */}
          <Card style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle style={{ color: colors.textDark }}>Campaign Snapshot</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                style={{ color: colors.primary }}
              >
                <Link to="/campaigns/ai-manager">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate ? (
                <>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Office & Jurisdiction</span>
                    <span style={{ color: colors.textDark }}>
                      {candidate.office || "Not set"} {candidate.jurisdiction ? `— ${candidate.jurisdiction}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Party/Affiliation</span>
                    <span style={{ color: colors.textDark }}>{candidate.party_or_affiliation || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Status</span>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(candidate.campaign_status).bg,
                        color: getStatusColor(candidate.campaign_status).text
                      }}
                    >
                      {candidate.campaign_status}
                    </Badge>
                  </div>
                  {candidate.top_issues && candidate.top_issues.length > 0 && (
                    <div>
                      <span className="block mb-2" style={{ color: colors.textMuted }}>Top Issues</span>
                      <div className="flex flex-wrap gap-2">
                        {candidate.top_issues.map((issue, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            style={{ borderColor: colors.primary, color: colors.primary }}
                          >
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="mb-4" style={{ color: colors.textMuted }}>No campaign profile yet</p>
                  <Button 
                    asChild 
                    style={{ backgroundColor: colors.primary, color: "white" }}
                  >
                    <Link to="/campaigns/ai-manager">Set Up Your Campaign</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Action List */}
          <Card style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="flex items-center gap-2" style={{ color: colors.textDark }}>
                <Sparkles className="h-5 w-5" style={{ color: colors.accent }} />
                Today's Action List
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                style={{ color: colors.textMuted }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestedTasks.map((task, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50"
                    style={{ backgroundColor: colors.background }}
                  >
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <span className="text-sm font-medium" style={{ color: colors.textDark }}>{index + 1}</span>
                    </div>
                    <p style={{ color: colors.textDark }}>{task}</p>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                asChild
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                <Link to="/campaigns/ai-manager">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask AI to refresh my plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <Card style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}>
          <CardHeader>
            <CardTitle style={{ color: colors.textDark }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl transition-all text-center group hover:shadow-md"
                  style={{ 
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.panelBorder}`
                  }}
                >
                  <div 
                    className="h-11 w-11 rounded-lg flex items-center justify-center transition-colors group-hover:scale-105"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <action.icon className="h-5 w-5" style={{ color: colors.primary }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: colors.textDark }}>
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal for unauthenticated users */}
      <CampaignAuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </CampaignLayout>
  );
}
