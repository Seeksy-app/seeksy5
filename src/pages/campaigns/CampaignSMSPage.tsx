import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Plus, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";

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
  { icon: MessageSquare, title: "Broadcast messages", desc: "Send texts to all supporters at once" },
  { icon: Sparkles, title: "AI suggestions", desc: "Generate compelling message copy" },
  { icon: ShieldCheck, title: "Compliance ready", desc: "Built-in opt-out controls" },
];

export default function CampaignSMSPage() {
  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              SMS Campaigns
            </h1>
            <p style={{ color: colors.textMuted }}>
              Reach supporters directly with text message broadcasts
            </p>
          </div>
          <Button style={{ backgroundColor: colors.primary, color: "white" }}>
            <Plus className="h-4 w-4 mr-2" />
            New Broadcast
          </Button>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4">
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
              <Phone className="h-8 w-8" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>
              No SMS campaigns yet
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textMuted }}>
              Text messaging has the highest open rates. Start reaching your supporters directly.
            </p>
            <Button style={{ backgroundColor: colors.primary, color: "white" }}>
              <Plus className="h-4 w-4 mr-2" />
              Send Your First Broadcast
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
