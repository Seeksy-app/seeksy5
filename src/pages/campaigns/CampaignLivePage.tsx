import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Plus, Users, Sparkles, PlayCircle } from "lucide-react";

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
  { icon: Video, title: "Go live instantly", desc: "Stream to your supporters in seconds" },
  { icon: Users, title: "Event links", desc: "Share a link for supporters to join" },
  { icon: Sparkles, title: "AI host scripts", desc: "Generate talking points for your stream" },
  { icon: PlayCircle, title: "Replay archive", desc: "All streams saved for later viewing" },
];

export default function CampaignLivePage() {
  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: colors.textDark }}>
              Live Streaming
            </h1>
            <p style={{ color: colors.textMuted }}>
              Connect with supporters through live video broadcasts
            </p>
          </div>
          <Button style={{ backgroundColor: colors.accent, color: colors.textDark }}>
            <Video className="h-4 w-4 mr-2" />
            Go Live Now
          </Button>
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
              style={{ backgroundColor: `${colors.accent}40` }}
            >
              <Video className="h-8 w-8" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textDark }}>
              Ready to go live?
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.textMuted }}>
              Host town halls, Q&A sessions, and campaign updates. Your supporters can join from any device.
            </p>
            <Button style={{ backgroundColor: colors.primary, color: "white" }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Your First Stream
            </Button>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
