import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, CreditCard, RefreshCw, BarChart3, Link2 } from "lucide-react";

const colors = {
  background: "#F7F9FC",
  panel: "#FFFFFF",
  panelBorder: "#E2E8F0",
  primary: "#003A9E",
  secondary: "#1A73E8",
  accent: "#FFD764",
  success: "#039855",
  textDark: "#1A1A1A",
  textMuted: "#6B7280",
};

const features = [
  { icon: Link2, title: "Donation pages", desc: "Generate branded donation links" },
  { icon: CreditCard, title: "Secure payments", desc: "Powered by Stripe" },
  { icon: RefreshCw, title: "Recurring donations", desc: "Monthly supporter contributions" },
  { icon: BarChart3, title: "Instant summaries", desc: "Track all donations in real-time" },
];

const stats = [
  { label: "Total Raised", value: "$0.00" },
  { label: "Donors", value: "0" },
  { label: "Avg. Donation", value: "$0.00" },
  { label: "Recurring", value: "0" },
];

export default function CampaignDonationsPage() {
  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              Donation Tools
            </h1>
            <p style={{ color: colors.textMuted }}>
              Accept and track campaign contributions
            </p>
          </div>
          <Button style={{ backgroundColor: colors.success, color: "white" }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Donation Page
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card 
              key={i}
              style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}
            >
              <CardContent className="p-5">
                <p className="text-sm mb-1" style={{ color: colors.textMuted }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: colors.textDark }}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card 
              key={i}
              style={{ backgroundColor: colors.panel, borderColor: colors.panelBorder }}
            >
              <CardContent className="p-5">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${colors.success}15` }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: colors.success }} />
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
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <DollarSign className="h-8 w-8" style={{ color: colors.success }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>
              Start accepting donations
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textMuted }}>
              Create a donation page and share it with supporters. All payments are processed securely.
            </p>
            <Button style={{ backgroundColor: colors.primary, color: "white" }}>
              <Plus className="h-4 w-4 mr-2" />
              Set Up Donations
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
