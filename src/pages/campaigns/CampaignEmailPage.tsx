import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Users, BarChart3, Send, FileText } from "lucide-react";

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

const features = [
  { icon: FileText, title: "Drag-and-drop builder", desc: "Create beautiful emails without code" },
  { icon: Users, title: "Import contacts", desc: "Upload your supporter list" },
  { icon: Send, title: "AI auto-draft", desc: "Generate fundraising & persuasion emails" },
  { icon: BarChart3, title: "Track performance", desc: "Open rates, clicks, and conversions" },
];

export default function CampaignEmailPage() {
  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              Email Campaigns
            </h1>
            <p style={{ color: colors.textMuted }}>
              Create and send email sequences to your supporters
            </p>
          </div>
          <Button style={{ backgroundColor: colors.primary, color: "white" }}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card 
              key={i}
              style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}
            >
              <CardContent className="p-5">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: colors.textDark }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        <Card style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}>
          <CardContent className="py-16 text-center">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Mail className="h-8 w-8" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>
              No email campaigns yet
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textMuted }}>
              Start building your email list and send compelling messages to your supporters.
            </p>
            <Button style={{ backgroundColor: colors.primary, color: "white" }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
